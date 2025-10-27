import RVA, { rvaToVa } from "./rvas.js";

const getHeapAllocatorOf = new NativeFunction(
    rvaToVa(RVA["DLKR::DLAllocator::GetHeapAllocatorOf"]),
    "pointer",
    ["pointer"],
);

/**
 * @returns the allocation size of a heap object allocated with a DLAllocator
 */
export default function getAllocationSize(pointer: NativePointer): number | undefined {
    const allocator = getHeapAllocatorOf(pointer);
    if (allocator.isNull()) {
        return;
    }
    const vftable = allocator.readPointer();
    const getAllocationSizeMethod = new NativeFunction(vftable.add(0x40).readPointer(), "uint64", [
        "pointer",
        "pointer",
    ]);
    return getAllocationSizeMethod(allocator, pointer).toNumber();
}
