export enum DLStringEncoding {
    UTF8 = 0,
    UTF16 = 1,
    ISO_8859 = 2,
    SHIFT_JIS = 3,
    EUC_JP = 4,
    UTF32 = 5,
}

export default class DLString implements ObjectWrapper {
    public handle: NativePointer;

    constructor(handle: NativePointer) {
        this.handle = handle;
    }

    get allocator() {
        return this.handle.add(0x0).readPointer();
    }

    get length() {
        return this.handle.add(0x18).readU64().toNumber();
    }

    get capacity() {
        return this.handle.add(0x20).readU64().toNumber();
    }

    get encoding() {
        return this.handle.add(0x28).readU8() as DLStringEncoding;
    }

    toString() {
        const { length, capacity, encoding } = this;
        const data = capacity >= 8 ? this.handle.add(0x8).readPointer() : this.handle.add(0x8);

        switch (encoding) {
            case DLStringEncoding.UTF8:
                return data.readUtf8String(length);
            case DLStringEncoding.UTF16:
                return data.readUtf16String(length);
            case DLStringEncoding.ISO_8859:
                return data.readAnsiString(length);
            default:
                return `Unsupported encoding ${DLStringEncoding[encoding] ?? encoding}`;
        }
    }
}
