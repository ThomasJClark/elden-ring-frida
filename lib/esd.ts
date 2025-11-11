import symbols from "./symbols.js";

export enum EzStateValueType {
    Float = 1,
    Int = 2,
    Unk = 3,
}

export class EzStateValue implements ObjectWrapper {
    handle: NativePointer;

    constructor(handle = Memory.alloc(0x10)) {
        this.handle = handle;
    }

    setValue(value: number, type = EzStateValueType.Float) {
        this.handle.add(0x8).writeInt(type);
        if (type === EzStateValueType.Float) {
            this.handle.add(0x0).writeFloat(value);
        } else if (type === EzStateValueType.Int) {
            this.handle.add(0x0).writeInt(value);
        }
    }

    getValue() {
        const type = this.handle.add(0x8).readInt() as EzStateValueType;
        if (type === EzStateValueType.Float) {
            return this.handle.add(0x0).readFloat();
        }
        if (type === EzStateValueType.Int) {
            return this.handle.add(0x0).readInt();
        }
        return null;
    }
}

export class CSEzStateTalkEvent implements ObjectWrapper {
    private static ctor = new NativeFunction(
        symbols["CS::CSEzStateTalkEvent::CSEzStateTalkEvent"],
        "pointer",
        ["pointer", "pointer", "int", "pointer"],
    );

    private static invoke = new NativeFunction(symbols["CS::CSEzStateTalkEvent::Invoke"], "void", [
        "pointer",
        "pointer",
    ]);

    handle = Memory.alloc(0x20);

    constructor(talkContext: NativePointer, talkId: number) {
        CSEzStateTalkEvent.ctor(this, talkContext, talkId, NULL);
    }

    invokeExternalEvent(...args: number[]) {
        const externalEvent = new EzStateExternalEventTemp(args[0], args);
        CSEzStateTalkEvent.invoke(this, externalEvent);
    }
}

export class EzStateExternalEventTemp implements ObjectWrapper {
    private static vftable = Memory.alloc(5 * Process.pointerSize);

    private static noop = new NativeCallback(() => {}, "void", []);

    private static getId = new NativeCallback(
        (self: NativePointer) => self.add(0x8).readInt(),
        "int",
        ["pointer"],
    );

    private static getArgCount = new NativeCallback(
        (self: NativePointer) => self.add(0xc).readInt(),
        "int",
        ["pointer"],
    );

    private static getArg = new NativeCallback(
        (self: NativePointer, idx: number) => self.add(0x10 + idx * 0x10),
        "pointer",
        ["pointer", "int"],
    );

    static {
        this.vftable.add(0 * Process.pointerSize).writePointer(this.noop);
        this.vftable.add(1 * Process.pointerSize).writePointer(this.noop);
        this.vftable.add(2 * Process.pointerSize).writePointer(this.getId);
        this.vftable.add(3 * Process.pointerSize).writePointer(this.getArgCount);
        this.vftable.add(4 * Process.pointerSize).writePointer(this.getArg);
    }

    handle: NativePointer;

    constructor(externalEventId: number, args: number[]) {
        this.handle = Memory.alloc(0x10 + 0x10 * args.length);
        this.handle.add(0x0).writePointer(EzStateExternalEventTemp.vftable);
        this.handle.add(0x8).writeInt(externalEventId);
        this.handle.add(0xc).writeInt(args.length);
        for (let i = 0; i < args.length; i++) {
            new EzStateValue(this.handle.add(0x10 + i * 0x10)).setValue(args[i]);
        }
    }
}

export class CSEzStateTalkEnv implements ObjectWrapper {
    private static ctor = new NativeFunction(
        symbols["CS::CSEzStateTalkEnv::CSEzStateTalkEnv"],
        "pointer",
        ["pointer", "pointer", "int", "pointer"],
    );

    private static invoke = new NativeFunction(symbols["CS::CSEzStateTalkEnv::Invoke"], "void", [
        "pointer",
        "pointer",
        "pointer",
    ]);

    handle = Memory.alloc(0x28);

    constructor(talkContext: NativePointer, talkId: number) {
        CSEzStateTalkEnv.ctor(this, talkContext, talkId, NULL);
    }

    invokeExternalEvent(...args: number[]) {
        const result = new EzStateValue();
        const environmentQuery = new EzStateEnvironmentQueryImpl(args[0], args);
        CSEzStateTalkEnv.invoke(this, result, environmentQuery);
        return result.getValue();
    }
}

export class EzStateEnvironmentQueryImpl implements ObjectWrapper {
    private static vftable = Memory.alloc(4 * Process.pointerSize);

    private static noop = new NativeCallback(() => {}, "void", []);

    private static getId = new NativeCallback(
        (self: NativePointer) => self.add(0x8).readInt(),
        "int",
        ["pointer"],
    );

    private static getArgCount = new NativeCallback(
        (self: NativePointer) => self.add(0xc).readInt(),
        "int",
        ["pointer"],
    );

    private static getArg = new NativeCallback(
        (self: NativePointer, _unk: NativePointer, idx: number) => self.add(0x10 + idx * 0x10),
        "pointer",
        ["pointer", "pointer", "int"],
    );

    static {
        this.vftable.add(0 * Process.pointerSize).writePointer(this.noop);
        this.vftable.add(1 * Process.pointerSize).writePointer(this.getId);
        this.vftable.add(2 * Process.pointerSize).writePointer(this.getArgCount);
        this.vftable.add(3 * Process.pointerSize).writePointer(this.getArg);
    }

    handle: NativePointer;

    constructor(externalEventId: number, args: number[]) {
        this.handle = Memory.alloc(0x10 + 0x10 * args.length);
        this.handle.add(0x0).writePointer(EzStateEnvironmentQueryImpl.vftable);
        this.handle.add(0x8).writeInt(externalEventId);
        this.handle.add(0xc).writeInt(args.length);
        for (let i = 0; i < args.length; i++) {
            new EzStateValue(this.handle.add(0x10 + i * 0x10)).setValue(args[i]);
        }
    }
}

/**
 * Wrapper that allows making adhoc ESD calls.
 */
export class ESDInvoker {
    private talkContext = Memory.alloc(0xc0);
    private talkContextInner = Memory.alloc(0x20);
    private talkEvent: CSEzStateTalkEvent;
    private talkEnv: CSEzStateTalkEnv;

    constructor(talkId: number) {
        this.talkContext.add(0x0).writeInt(talkId);
        this.talkContext.add(0x98).writePointer(this.talkContextInner);
        this.talkContextInner.add(0x18).writePointer(this.talkContext);
        this.talkEvent = new CSEzStateTalkEvent(this.talkContext, talkId);
        this.talkEnv = new CSEzStateTalkEnv(this.talkContext, talkId);
    }

    event(...args: number[]) {
        this.talkEvent.invokeExternalEvent(...args);
    }

    env(...args: number[]) {
        return this.talkEnv.invokeExternalEvent(...args);
    }
}
