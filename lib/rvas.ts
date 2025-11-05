const [{ base }] = Process.enumerateModules();

export default {
    "DLKR::DLAllocator::GetHeapAllocatorOf": 0xe1a2c0,
    "CS::CSEmkEventIns::CSEmkEventIns": 0x582700,
    "CS::CSEmkEventIns::~CSEmkEventIns": 0x5828d0,
    "EMEVD::EMEVDGroupSwitch": 0x567e00,
    GLOBAL_CSEmkSystem: 0x3d67bd0,
};

export function rvaToVa(rva: number): NativePointer {
    return base.add(rva);
}

export function vaToRva(va: NativePointer): number {
    return va.sub(base).toInt32();
}
