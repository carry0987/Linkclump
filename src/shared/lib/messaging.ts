import type { MessageMap, Message } from '@/shared/types';
import { toErrorResponse } from '@/shared/lib/error';

// add a private sentinel to indicate "I did not handle this message"
const UNHANDLED = Symbol('UNHANDLED');
// Make every nested field optional and possibly undefined
type DeepPartial<T> = T extends Function
    ? T
    : T extends object
      ? { [K in keyof T]?: DeepPartial<T[K]> }
      : T | undefined;

const onMessage = <T extends Message = Message>(
    handler: (msg: T, sender: chrome.runtime.MessageSender) => unknown | Promise<unknown> | typeof UNHANDLED
) => {
    const listener = (
        msg: unknown,
        sender: chrome.runtime.MessageSender,
        sendResponse: (response?: unknown) => void
    ) => {
        try {
            const maybe = handler(msg as T, sender);

            // async branch
            if (maybe instanceof Promise) {
                maybe
                    .then((r) => {
                        if (r === UNHANDLED) return; // do not respond, allow other listeners
                        sendResponse(r);
                    })
                    .catch((e) => sendResponse(toErrorResponse(e)));
                // only keep the channel open if we *intend* to respond
                return true;
            }

            // sync branch
            if (maybe === UNHANDLED) {
                // do not respond; return false to allow other listeners to handle
                return false;
            }

            sendResponse(maybe);
            return true;
        } catch (e) {
            sendResponse(toErrorResponse(e));
            return true;
        }
    };

    // add listener
    chrome.runtime.onMessage.addListener(listener);

    // return unsubscriber
    return () => chrome.runtime.onMessage.removeListener(listener);
};

export const createMessenger = <M extends Record<string, { req?: any; res?: any }>>() => {
    const sendToTab = <K extends keyof M & string, TRes = M[K] extends { res: infer R } ? R : unknown>(
        tabId: number,
        type: K,
        payload?: M[K] extends { req: infer P } ? P : undefined,
        opts?: { timeoutMs?: number }
    ) =>
        new Promise<TRes>((resolve, reject) => {
            let timer: ReturnType<typeof setTimeout> | undefined;
            if (opts?.timeoutMs) {
                timer = globalThis.setTimeout(() => reject(new Error('Message timeout')), opts.timeoutMs);
            }

            chrome.tabs.sendMessage(tabId, { type, payload } as Message, (res) => {
                if (timer) globalThis.clearTimeout(timer);
                const err = chrome.runtime.lastError?.message;
                if (err) return reject(new Error(err));
                resolve(res as TRes);
            });
        });

    const sendToActive = <K extends keyof M & string, TRes = M[K] extends { res: infer R } ? R : unknown>(
        type: K,
        payload?: M[K] extends { req: infer P } ? P : undefined,
        opts?: { timeoutMs?: number }
    ) =>
        new Promise<TRes | undefined>((resolve, reject) => {
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                const id = tabs[0]?.id;
                if (!id) return resolve(undefined);
                sendToTab(id, type, payload as any, opts)
                    .then((r) => resolve(r as unknown as TRes | undefined))
                    .catch(reject);
            });
        });

    // type-safe listener by message type; returns unsubscriber
    const on = <K extends keyof M & string>(
        type: K,
        handler: (
            payload: M[K] extends { req: infer P } ? Readonly<DeepPartial<P>> : undefined,
            sender: chrome.runtime.MessageSender
        ) => (M[K] extends { res: infer R } ? R : unknown) | Promise<M[K] extends { res: infer R } ? R : unknown>
    ) => {
        const off = onMessage((msg, sender) => {
            if ((msg as Message).type !== type) return UNHANDLED;
            return handler((msg as any).payload, sender);
        });
        return off;
    };

    // Send message to background script
    const sendToBackground = <K extends keyof M & string, TRes = M[K] extends { res: infer R } ? R : unknown>(
        type: K,
        payload?: M[K] extends { req: infer P } ? P : undefined,
        opts?: { timeoutMs?: number }
    ) =>
        new Promise<TRes>((resolve, reject) => {
            let timer: ReturnType<typeof setTimeout> | undefined;
            if (opts?.timeoutMs) {
                timer = globalThis.setTimeout(() => reject(new Error('Message timeout')), opts.timeoutMs);
            }

            chrome.runtime.sendMessage({ type, payload } as Message, (res) => {
                if (timer) globalThis.clearTimeout(timer);
                const err = chrome.runtime.lastError?.message;
                if (err) return reject(new Error(err));
                resolve(res as TRes);
            });
        });

    return { sendToActive, sendToTab, sendToBackground, on };
};

// Export a concrete, typed bus for your message map
export const bus = createMessenger<MessageMap>();
