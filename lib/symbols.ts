const { base } = Process.getModuleByName("eldenring.exe");

/**
 * Relative virtual addresses for eldenring.exe 2.6.1.0 (international build of app version 1.16.1)
 *
 * If these are also labeled in the shared Ghidra, please keep the same names to make static
 * analysis easier.
 */
const rvas = {
    base: 0x0,
    "CS::CSEmkEventIns::~CSEmkEventIns": 0x5828d0,
    "CS::CSEmkEventIns::CSEmkEventIns": 0x582700,
    "DLKR::DLAllocator::GetHeapAllocatorOf": 0xe1a2c0,
    "EMEVD::EMEVDGroupSwitch": 0x567e00,
    GLOBAL_CSEmkSystem: 0x3d67bd0,
};

export default Object.fromEntries(
    Object.entries(rvas).map(([name, rva]) => [name, base.add(rva)]),
) as Record<keyof typeof rvas, NativePointer>;
