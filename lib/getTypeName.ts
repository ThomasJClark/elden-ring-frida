import { rvaToVa } from "./rvas.js";

const UNDNAME_NO_ARGUMENTS = 0x2000;
const COL_SIG_REV1 = 1;
const UnDecorateSymbolName = new NativeFunction(
    Module.load("dbghelp.dll").getExportByName("UnDecorateSymbolName"),
    "uint32",
    ["pointer", "pointer", "uint32", "uint32"],
);

/**
 * @returns the RTTI name of the object at the given address
 */
export default function getTypeName(pointer: NativePointer): string | undefined {
    try {
        // https://www.lukaszlipski.dev/post/rtti-msvc/
        const completeObjectLocator = pointer.readPointer().sub(0x8).readPointer();
        if (completeObjectLocator.add(0x0).readInt() != COL_SIG_REV1) {
            return;
        }

        const typeDescriptor = rvaToVa(completeObjectLocator.add(0xc).readInt());
        let rawName = typeDescriptor.add(0x10);

        // Skip first '.' character in the mangled RTTI name. UnDecorateSymbolName expects the input to
        // start at the second character ('?') for some reason
        if (rawName.readU8() === ".".charCodeAt(0)) {
            rawName = rawName.add(1);

            const name = Memory.alloc(1024);
            if (UnDecorateSymbolName(rawName, name, 1024, UNDNAME_NO_ARGUMENTS)) {
                return name.readCString()?.replaceAll(/\bclass /g, "") ?? undefined;
            }
        }
    } catch {}
}
