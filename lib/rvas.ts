const [{ base }] = Process.enumerateModules();

export default {
    "DLKR::DLAllocator::GetHeapAllocatorOf": 0xe1a2c0,
};

export function rvaToVa(rva: number): NativePointer {
    return base.add(rva);
}

export function vaToRva(va: NativePointer): number {
    return va.sub(base).toInt32();
}
