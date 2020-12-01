// @flow strict

/* global EventTarget, IDBEnvironment */

export interface Window extends EventTarget, IDBEnvironment {
    +caches: CacheStorage;
    +clientInformation: Navigator;
    +closed: boolean;
    defaultStatus: string;
    +devicePixelRatio: number;
    +document: Document;
    +doNotTrack: string;
    +frameElement: Element;
    +frames: Window;
    +history: History;
    +innerHeight: number;
    +innerWidth: number;
    +isSecureContext: boolean;
    +length: number;
    +location: Location;
    +origin: string;
    name: string;
    +navigator: Navigator;
    offscreenBuffering: string | boolean;
    onabort: (ev: UIEvent) => ?boolean;
    onafterprint: (ev: Event) => ?boolean;
    onbeforeprint: (ev: Event) => ?boolean;
    onbeforeunload: (ev: Event) => ?boolean;
    onblur: (ev: FocusEvent) => ?boolean;
    oncanplay: (ev: Event) => ?boolean;
    oncanplaythrough: (ev: Event) => ?boolean;
    onchange: (ev: Event) => ?boolean;
    onclick: (ev: MouseEvent) => ?boolean;
    oncompassneedscalibration: (ev: Event) => ?boolean;
    oncontextmenu: (ev: Event) => ?boolean;
    ondblclick: (ev: MouseEvent) => ?boolean;
    ondevicelight: (ev: Event) => ?boolean;
    ondevicemotion: (ev: Event) => ?boolean;
    ondeviceorientation: (ev: Event) => ?boolean;
    ondrag: (ev: DragEvent) => ?boolean;
    ondragend: (ev: DragEvent) => ?boolean;
    ondragenter: (ev: DragEvent) => ?boolean;
    ondragleave: (ev: DragEvent) => ?boolean;
    ondragover: (ev: DragEvent) => ?boolean;
    ondragstart: (ev: DragEvent) => ?boolean;
    ondrop: (ev: DragEvent) => ?boolean;
    ondurationchange: (ev: Event) => ?boolean;
    onemptied: (ev: Event) => ?boolean;
    onended: (ev: Event) => ?boolean;
    onerror: (ev: Event) => ?boolean;
    onfocus: (ev: FocusEvent) => ?boolean;
    onhashchange: (ev: Event) => ?boolean;
    oninput: (ev: Event) => ?boolean;
    oninvalid: (ev: Event) => ?boolean;
    onkeydown: (ev: KeyboardEvent) => ?boolean;
    onkeypress: (ev: KeyboardEvent) => ?boolean;
    onkeyup: (ev: KeyboardEvent) => ?boolean;
    onload: (ev: Event) => ?boolean;
    onloadeddata: (ev: Event) => ?boolean;
    onloadedmetadata: (ev: Event) => ?boolean;
    onloadstart: (ev: Event) => ?boolean;
    onmessage: (ev: MessageEvent) => ?boolean;
    onmousedown: (ev: MouseEvent) => ?boolean;
    onmouseenter: (ev: MouseEvent) => ?boolean;
    onmouseleave: (ev: MouseEvent) => ?boolean;
    onmousemove: (ev: MouseEvent) => ?boolean;
    onmouseout: (ev: MouseEvent) => ?boolean;
    onmouseover: (ev: MouseEvent) => ?boolean;
    onmouseup: (ev: MouseEvent) => ?boolean;
    onmousewheel: (ev: WheelEvent) => ?boolean;
    onoffline: (ev: Event) => ?boolean;
    ononline: (ev: Event) => ?boolean;
    onorientationchange: (ev: Event) => ?boolean;
    onpagehide: (ev: Event) => ?boolean;
    onpageshow: (ev: Event) => ?boolean;
    onpause: (ev: Event) => ?boolean;
    onplay: (ev: Event) => ?boolean;
    onplaying: (ev: Event) => ?boolean;
    onpopstate: (ev: Event) => ?boolean;
    onprogress: (ev: ProgressEvent) => ?boolean;
    onratechange: (ev: Event) => ?boolean;
    onreadystatechange: (ev: ProgressEvent) => ?boolean;
    onreset: (ev: Event) => ?boolean;
    onresize: (ev: UIEvent) => ?boolean;
    onscroll: (ev: UIEvent) => ?boolean;
    onseeked: (ev: Event) => ?boolean;
    onseeking: (ev: Event) => ?boolean;
    onselect: (ev: UIEvent) => ?boolean;
    onstalled: (ev: Event) => ?boolean;
    onstorage: (ev: Event) => ?boolean;
    onsubmit: (ev: Event) => ?boolean;
    onsuspend: (ev: Event) => ?boolean;
    ontimeupdate: (ev: Event) => ?boolean;
    ontouchcancel: (ev: TouchEvent) => ?boolean;
    ontouchend: (ev: TouchEvent) => ?boolean;
    ontouchmove: (ev: TouchEvent) => ?boolean;
    ontouchstart: (ev: TouchEvent) => ?boolean;
    onunload: (ev: Event) => ?boolean;
    onvolumechange: (ev: Event) => ?boolean;
    onwaiting: (ev: Event) => ?boolean;
    opener: Window;
    orientation: string | number;
    +outerHeight: number;
    +outerWidth: number;
    +pageXOffset: number;
    +pageYOffset: number;
    +parent: Window;
    +performance: Performance;
    +screen: Screen;
    +screenLeft: number;
    +screenTop: number;
    +screenX: number;
    +screenY: number;
    +scrollX: number;
    +scrollY: number;
    +self: Window;
    status: string;
    +top: Window;
    +window: Window;

    Blob: typeof Blob;
    HTMLImageElement: typeof HTMLImageElement;
    HTMLElement: typeof HTMLElement;
    HTMLVideoElement: typeof HTMLVideoElement;
    HTMLCanvasElement: typeof HTMLCanvasElement;
    Image: typeof Image;
    ImageData: typeof ImageData;
    URL: typeof URL;
    URLSearchParams: typeof URLSearchParams;
    WebGLFramebuffer: typeof WebGLFramebuffer;
    WheelEvent: typeof WheelEvent;
    Worker: typeof Worker;
    XMLHttpRequest: typeof XMLHttpRequest;
    Request: typeof Request;
    AbortController: typeof AbortController;

    alert(message?: string): void;
    blur(): void;
    captureEvents(): void;
    close(): void;
    confirm(message?: string): boolean;
    focus(): void;
    getComputedStyle(elt: Element, pseudoElt?: string): CSSStyleDeclaration;
    getMatchedCSSRules(elt: Element, pseudoElt?: string): CSSRuleList;
    getSelection(): Selection;
    moveBy(x?: number, y?: number): void;
    moveTo(x?: number, y?: number): void;
    msWriteProfilerMark(profilerMarkName: string): void;
    open(url?: string, target?: string, features?: string, replace?: boolean): Window;
    postMessage(message: mixed, targetOrigin: string, transfer?: ArrayBuffer[]): void;
    print(): void;
    prompt(message?: string, _default?: string): string | null;
    releaseEvents(): void;
    resizeBy(x?: number, y?: number): void;
    resizeTo(x?: number, y?: number): void;
    scroll(x?: number, y?: number): void;
    scrollBy(x?: number, y?: number): void;
    scrollTo(x?: number, y?: number): void;
    stop(): void;

    clearInterval(intervalId?: number): void;
    clearTimeout(timeoutId?: number): void;
    setTimeout(callback: () => void, ms?: number): number;
    setInterval(callback: () => void, ms?: number): number;

    requestAnimationFrame(callback: (timestamp: number) => void): number;
    cancelAnimationFrame(handle: number): void;
    msRequestAnimationFrame(callback: (timestamp: number) => void): number;
    msCancelAnimationFrame(handle: number): void;
    webkitRequestAnimationFrame(callback: (timestamp: number) => void): number;
    webkitCancelAnimationFrame(handle: number): void;

    // GeoGlobal-tileSize-huangwei
    GEOGLOBE_TILESIZE?: number;
}
