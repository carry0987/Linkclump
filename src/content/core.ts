import { bus } from '@/shared/lib/messaging';
import { MSG, Z_INDEX, OS_WIN, OS_LINUX, OS_MAC, LEFT_BUTTON, END_KEY, HOME_KEY } from '@/shared/constants';
import type { Settings, Action } from '@/shared/config';
import type { LinkElement, Link } from '@/shared/types';

// Detect OS
const detectOS = (): number => {
    const userAgent = navigator.userAgent;
    if (userAgent.includes('Win')) return OS_WIN;
    if (userAgent.includes('Mac')) return OS_MAC;

    return OS_LINUX;
};

const os = detectOS();

class Core {
    private settings: Settings | null = null;
    private currentSetting: string | null = null;
    private keyPressed: string | null = null;
    private mouseButton: number | null = null;
    private stopMenu = false;
    private boxOn = false;
    private smartSelect = false;
    private mouseX = -1;
    private mouseY = -1;
    private scrollId = 0;
    private links: LinkElement[] = [];
    private scrollBugIgnore = false;
    private timer = 0;
    private box: HTMLSpanElement | null = null;
    private countLabel: HTMLSpanElement | null = null;
    private boxStartX = 0;
    private boxStartY = 0;

    // Event initialization
    private onMouseMove = this.handleMouseMove.bind(this);
    private onMouseUp = this.handleMouseUp.bind(this);
    private onMouseWheel = this.handleMouseWheel.bind(this);
    private onMouseOut = this.handleMouseOut.bind(this);

    async init() {
        try {
            const response = await bus.sendToBackground(MSG.LINKCLUMP_INIT, {});
            if (response) {
                this.settings = response;
                const blocked = response.blocked || [];

                // Check if current URL is blocked
                let allowed = true;
                for (const pattern of blocked) {
                    if (pattern === '') continue;
                    const re = new RegExp(pattern, 'i');
                    if (re.test(window.location.href)) {
                        allowed = false;
                        console.log(`Linkclump is blocked on this site: ${pattern}`);
                        break;
                    }
                }

                if (allowed) {
                    this.setupEventListeners();
                }
            }
        } catch (error) {
            console.error('Failed to initialize Linkclump:', error);
        }

        // Listen for settings updates
        bus.on(MSG.LINKCLUMP_UPDATE, (payload) => {
            if (payload.settings) {
                this.settings = payload.settings;
            }

            return { ok: true };
        });

        // Listen for copy requests
        bus.on(MSG.LINKCLUMP_COPY, async (payload: { text?: string }) => {
            if (!payload.text || !document.hasFocus()) return { ok: false };

            try {
                await navigator.clipboard.writeText(payload.text);
                return { ok: true };
            } catch (err) {
                console.error('Clipboard write failed:', (err as Error).message);
                return { ok: false };
            }
        });
    }

    private setupEventListeners() {
        window.addEventListener('mousedown', this.handleMouseDown.bind(this), true);
        window.addEventListener('keydown', this.handleKeyDown.bind(this), true);
        window.addEventListener('keyup', this.handleKeyUp.bind(this), true);
        window.addEventListener('blur', this.handleBlur.bind(this), true);
        window.addEventListener('contextmenu', this.handleContextMenu.bind(this), true);
    }

    private preventEscalation(event: MouseEvent) {
        event.stopPropagation();
        event.preventDefault();
    }

    private handleMouseDown(event: MouseEvent) {
        this.mouseButton = event.button;

        if (os === OS_WIN) {
            this.stopMenu = false;
        }

        if (this.allowSelection()) {
            if (os === OS_LINUX || (os === OS_WIN && this.mouseButton === LEFT_BUTTON)) {
                this.preventEscalation(event);
            }

            if (this.timer !== 0) {
                clearTimeout(this.timer);
                this.timer = 0;
                if (os === OS_WIN) {
                    this.stopMenu = true;
                }
            } else {
                if (this.boxOn) {
                    console.log("box wasn't removed from previous operation");
                    this.cleanUp();
                }

                // Create selection box
                this.createBox();

                // Update position
                this.boxStartX = event.pageX;
                this.boxStartY = event.pageY;
                this.updateBox(event.pageX, event.pageY);

                // Setup mouse move and mouse up
                window.addEventListener('mousemove', this.onMouseMove, true);
                window.addEventListener('mouseup', this.onMouseUp, true);
                window.addEventListener('wheel', this.onMouseWheel, true);
                window.addEventListener('mouseout', this.onMouseOut, true);
            }
        }
    }

    private handleMouseMove(event: MouseEvent) {
        this.preventEscalation(event);

        if (this.allowSelection() || this.scrollBugIgnore) {
            this.scrollBugIgnore = false;
            this.updateBox(event.pageX, event.pageY);

            // While detect keeps on calling false then recall the method
            while (!this.detectLinks(event.pageX, event.pageY, false)) {
                // retry detection
            }
        } else {
            // Only stop if the mouseup timer is no longer set
            if (this.timer === 0) {
                this.stop();
            }
        }
    }

    private handleMouseUp(event: MouseEvent) {
        this.preventEscalation(event);

        if (this.boxOn) {
            // Allow the detection of the mouse to bounce
            if (this.allowSelection() && this.timer === 0) {
                this.timer = window.setTimeout(() => {
                    this.updateBox(event.pageX, event.pageY);
                    this.detectLinks(event.pageX, event.pageY, true);
                    this.stop();
                    this.timer = 0;
                }, 100);
            }
        } else {
            // False alarm
            this.stop();
        }
    }

    private handleKeyDown(event: KeyboardEvent) {
        if (event.key !== END_KEY && event.key !== HOME_KEY) {
            this.keyPressed = event.key;
            // Turn menu off for Linux
            if (os === OS_LINUX && this.allowKey(this.keyPressed)) {
                this.stopMenu = true;
            }
        } else {
            this.scrollBugIgnore = true;
        }
    }

    private handleKeyUp(event: KeyboardEvent) {
        if (event.key !== END_KEY && event.key !== HOME_KEY) {
            this.removeKey();
        }
    }

    private handleBlur() {
        this.removeKey();
    }

    private handleContextMenu(event: MouseEvent) {
        if (this.stopMenu) {
            event.preventDefault();
        }
    }

    private handleMouseWheel() {
        this.scrollBugIgnore = true;
    }

    private handleMouseOut(event: MouseEvent) {
        this.handleMouseMove(event);
        // The mouse wheel event might also call this event
        this.scrollBugIgnore = true;
    }

    private allowKey(key: string): boolean {
        if (!this.settings) return false;

        for (const id in this.settings.actions) {
            if (this.settings.actions[id].key === key) {
                return true;
            }
        }

        return false;
    }

    private allowSelection(): boolean {
        if (!this.settings || this.mouseButton === null) return false;

        for (const id in this.settings.actions) {
            const action = this.settings.actions[id];
            if (action.mouse === this.mouseButton && action.key === this.keyPressed) {
                this.currentSetting = id;
                if (this.box) {
                    this.box.style.border = `2px dotted ${action.color}`;
                }

                return true;
            }
        }

        return false;
    }

    private removeKey() {
        // Turn menu on for Linux
        if (os === OS_LINUX) {
            this.stopMenu = false;
        }
        this.keyPressed = null;
    }

    private createBox() {
        if (this.box === null) {
            this.box = document.createElement('span');
            this.box.style.margin = '0px auto';
            this.box.style.position = 'absolute';
            this.box.style.zIndex = String(Z_INDEX);
            this.box.style.visibility = 'hidden';
            this.box.style.pointerEvents = 'none';

            this.countLabel = document.createElement('span');
            this.countLabel.style.zIndex = String(Z_INDEX);
            this.countLabel.style.position = 'absolute';
            this.countLabel.style.visibility = 'hidden';
            this.countLabel.style.fontSize = '10px';
            this.countLabel.style.fontFamily = 'Arial, sans-serif';
            this.countLabel.style.color = 'black';
            this.countLabel.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
            this.countLabel.style.padding = '2px 5px';
            this.countLabel.style.borderRadius = '3px';
            this.countLabel.style.pointerEvents = 'none';

            document.body.appendChild(this.box);
            document.body.appendChild(this.countLabel);
        }
    }

    private updateBox(x: number, y: number) {
        if (!this.box || !this.countLabel) return;

        const width = Math.max(
            document.documentElement.clientWidth || 0,
            document.body.scrollWidth || 0,
            document.documentElement.scrollWidth || 0,
            document.body.offsetWidth || 0,
            document.documentElement.offsetWidth || 0
        );
        const height = Math.max(
            document.documentElement.clientHeight || 0,
            document.body.scrollHeight || 0,
            document.documentElement.scrollHeight || 0,
            document.body.offsetHeight || 0,
            document.documentElement.offsetHeight || 0
        );

        x = Math.min(x, width - 7);
        y = Math.min(y, height - 7);

        const x1 = Math.min(this.boxStartX, x);
        const x2 = Math.max(this.boxStartX, x);
        const y1 = Math.min(this.boxStartY, y);
        const y2 = Math.max(this.boxStartY, y);

        this.box.style.left = `${x1}px`;
        this.box.style.width = `${x2 - x1}px`;
        this.box.style.top = `${y1}px`;
        this.box.style.height = `${y2 - y1}px`;

        this.countLabel.style.left = `${x - 15}px`;
        this.countLabel.style.top = `${y - 15}px`;

        this.mouseX = x;
        this.mouseY = y;
    }

    private detectLinks(x: number, y: number, open: boolean): boolean {
        if (!this.settings || !this.currentSetting || !this.box) return true;

        const action = this.settings.actions[this.currentSetting];
        if (!action) return true;

        // Check if box is large enough
        if (!this.boxOn) {
            const width = parseFloat(this.box.style.width);
            const height = parseFloat(this.box.style.height);
            if (width < 5 && height < 5) {
                return true;
            }
            this.start(action);
        }

        if (!this.scrollId) {
            this.scrollId = window.setInterval(() => this.scroll(), 100);
        }

        let count = 0;
        const countSet = new Set<string>();
        const openTabs: Link[] = [];

        const x1 = parseFloat(this.box.style.left);
        const x2 = x1 + parseFloat(this.box.style.width);
        const y1 = parseFloat(this.box.style.top);
        const y2 = y1 + parseFloat(this.box.style.height);

        for (const link of this.links) {
            const overlaps = !(link.x1 > x2 || link.x2 < x1 || link.y1 > y2 || link.y2 < y1);

            if ((!this.smartSelect || link.important) && overlaps) {
                if (open) {
                    openTabs.push({ url: link.href, title: link.innerText || link.textContent || '' });
                }

                if (!this.smartSelect) {
                    if (link.important) {
                        this.smartSelect = true;
                        return false;
                    }
                } else {
                    if (link.important) count++;
                }

                if (!link.box) {
                    const linkBox = document.createElement('span');
                    linkBox.style.margin = '0px auto';
                    linkBox.style.border = '1px solid red';
                    linkBox.style.position = 'absolute';
                    linkBox.style.width = `${link.width}px`;
                    linkBox.style.height = `${link.height}px`;
                    linkBox.style.top = `${link.y1}px`;
                    linkBox.style.left = `${link.x1}px`;
                    linkBox.style.zIndex = String(Z_INDEX);
                    document.body.appendChild(linkBox);
                    link.box = linkBox;
                } else {
                    link.box.style.visibility = 'visible';
                }

                countSet.add(link.href);
            } else {
                if (link.box) {
                    link.box.style.visibility = 'hidden';
                }
            }
        }

        if (this.smartSelect && count === 0) {
            this.smartSelect = false;
            return false;
        }

        if (this.countLabel) {
            this.countLabel.innerText = String(countSet.size);
        }

        if (open && openTabs.length > 0) {
            bus.sendToBackground(MSG.LINKCLUMP_ACTIVATE, { urls: openTabs, setting: action });
        }

        return true;
    }

    private start(action: Action) {
        document.body.style.userSelect = 'none';

        if (this.box) {
            this.box.style.visibility = 'visible';
        }
        if (this.countLabel) {
            this.countLabel.style.visibility = 'visible';
        }

        const pageLinks = document.links;

        // Create filter regex
        const jsProtocolPattern = new RegExp('^javascript:', 'i');
        console.log('Linkclump: Starting link detection with action', action.options.ignore);
        const ignorePattern =
            action.options.ignore && action.options.ignore.length > 1
                ? new RegExp(action.options.ignore.slice(1).join('|'), 'i')
                : null;
        const headingTagPattern = new RegExp('^H\\d$');

        for (let i = 0; i < pageLinks.length; i++) {
            const link = pageLinks[i] as LinkElement;

            // Skip javascript links
            if (jsProtocolPattern.test(link.href)) continue;

            // Skip empty links
            const href = link.getAttribute('href');
            if (!href || href === '#') continue;

            // Apply ignore filter
            if (ignorePattern && action.options.ignore) {
                const matches = ignorePattern.test(link.href) || ignorePattern.test(link.innerHTML);
                const filterMode = action.options.ignore[0];
                if ((filterMode === 0 && matches) || (filterMode === 1 && !matches)) {
                    continue;
                }
            }

            const comp = window.getComputedStyle(link);
            if (comp.visibility === 'hidden' || comp.display === 'none') continue;

            const pos = this.getXY(link);
            let width = link.offsetWidth;
            let height = link.offsetHeight;

            for (const child of link.childNodes) {
                if (child.nodeName === 'IMG') {
                    const img = child as HTMLImageElement;
                    const pos2 = this.getXY(img);
                    if (pos.y >= pos2.y) {
                        width = Math.max(width, img.offsetWidth);
                        height = Math.max(height, img.offsetHeight);
                    }
                }
            }

            link.x1 = pos.x;
            link.y1 = pos.y;
            link.x2 = pos.x + width;
            link.y2 = pos.y + height;
            link.width = width;
            link.height = height;
            link.box = null;
            link.important =
                action.options.smart === false &&
                link.parentNode !== null &&
                headingTagPattern.test(link.parentNode.nodeName);

            this.links.push(link);
        }

        this.boxOn = true;

        if (os === OS_WIN) {
            this.stopMenu = true;
        }
    }

    private stop() {
        document.body.style.userSelect = '';

        window.removeEventListener('mousemove', this.onMouseMove, true);
        window.removeEventListener('mouseup', this.onMouseUp, true);
        window.removeEventListener('wheel', this.onMouseWheel, true);
        window.removeEventListener('mouseout', this.onMouseOut, true);

        if (this.boxOn) {
            this.cleanUp();
        }

        if (os === OS_LINUX && this.settings && this.currentSetting) {
            const action = this.settings.actions[this.currentSetting];
            if (action && action.key !== this.keyPressed) {
                this.stopMenu = false;
            }
        }
    }

    private cleanUp() {
        // Remove the box
        if (this.box) {
            this.box.style.visibility = 'hidden';
        }
        if (this.countLabel) {
            this.countLabel.style.visibility = 'hidden';
        }

        this.boxOn = false;

        // Remove link boxes
        for (const link of this.links) {
            if (link.box) {
                document.body.removeChild(link.box);
                link.box = null;
            }
        }
        this.links = [];

        // Wipe clean the smart select
        this.smartSelect = false;
        this.mouseButton = null;
        this.keyPressed = null;
    }

    private scroll() {
        if (!this.allowSelection()) {
            if (this.scrollId) {
                clearInterval(this.scrollId);
                this.scrollId = 0;
            }
            return;
        }

        const y = this.mouseY - window.scrollY;
        const winHeight = window.innerHeight;

        if (y > winHeight - 20) {
            let speed = winHeight - y;
            if (speed < 2) speed = 60;
            else if (speed < 10) speed = 30;
            else speed = 10;

            window.scrollBy(0, speed);
            this.mouseY += speed;
            this.updateBox(this.mouseX, this.mouseY);
            this.detectLinks(this.mouseX, this.mouseY, false);
            this.scrollBugIgnore = true;
        } else if (window.scrollY > 0 && y < 20) {
            let speed = y;
            if (speed < 2) speed = 60;
            else if (speed < 10) speed = 30;
            else speed = 10;

            window.scrollBy(0, -speed);
            this.mouseY -= speed;
            this.updateBox(this.mouseX, this.mouseY);
            this.detectLinks(this.mouseX, this.mouseY, false);
            this.scrollBugIgnore = true;
        } else {
            if (this.scrollId) {
                clearInterval(this.scrollId);
                this.scrollId = 0;
            }
        }
    }

    private getXY(element: HTMLElement): { x: number; y: number } {
        let x = 0;
        let y = 0;
        let parent: HTMLElement | null = element;

        do {
            const style = window.getComputedStyle(parent);
            const matrix = new DOMMatrix(style.transform);
            x += parent.offsetLeft + matrix.m41;
            y += parent.offsetTop + matrix.m42;
            parent = parent.offsetParent as HTMLElement | null;
        } while (parent);

        parent = element.parentElement;
        while (parent && parent !== document.body) {
            if (parent.scrollLeft) x -= parent.scrollLeft;
            if (parent.scrollTop) y -= parent.scrollTop;
            parent = parent.parentElement;
        }

        return { x, y };
    }
}

// Initialize
const linkclump = new Core();
linkclump.init();
