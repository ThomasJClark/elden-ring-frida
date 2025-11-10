import symbols from "./symbols.js";

export enum EzStateFuncArgType {
    Float = 1,
    Int = 2,
    Unk = 3,
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

    private talkContextInner = Memory.alloc(0x20);
    private talkContext = Memory.alloc(0xc0);

    handle = Memory.alloc(0x20);

    constructor(talkId: number) {
        this.talkContext.add(0x0).writeInt(talkId);
        this.talkContext.add(0x98).writePointer(this.talkContextInner);
        this.talkContextInner.add(0x18).writePointer(this.talkContext);
        CSEzStateTalkEvent.ctor(this, this.talkContext, talkId, NULL);
    }

    invokeExternalEvent(...args: number[]) {
        CSEzStateTalkEvent.invoke(this, new EzStateExternalEventTemp(args[0], args));
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
            this.handle.add(0x10 + i * 0x10).writeFloat(args[i]);
            this.handle.add(0x10 + i * 0x10 + 0x8).writeInt(EzStateFuncArgType.Float);
        }
    }
}
