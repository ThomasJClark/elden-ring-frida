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
    "CS::CSEzStateTalkEnv::CSEzStateTalkEnv": 0xea0300,
    "CS::CSEzStateTalkEnv::Invoke": 0xea0640,
    "CS::CSEzStateTalkEvent::CSEzStateTalkEvent": 0xea5190,
    "CS::CSEzStateTalkEvent::Invoke": 0xea52b0,
    "DLKR::DLAllocator::GetHeapAllocatorOf": 0xe1a2c0,
    "EMEVD::EMEVDGroupSwitch": 0x567e00,
    "hkbInternal::hksi_lua_call": 0x14e36f0,
    "hkbInternal::hksi_lua_getglobal": 0x14e4570,
    "hkbInternal::hksi_lua_pushnil": 0x14f0390,
    "hkbInternal::hksi_lua_pushnumber": 0x14f03b0,
    "hkbInternal::hksi_lua_pushstring": 0x14f03d0,
    GLOBAL_CSEmkSystem: 0x3d67bd0,
};

export default Object.fromEntries(
    Object.entries(rvas).map(([name, rva]) => [name, base.add(rva)]),
) as Record<keyof typeof rvas, NativePointer>;
