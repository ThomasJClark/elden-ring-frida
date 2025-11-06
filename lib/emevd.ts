import symbols from "./symbols.js";

const emkEventInsCtor = new NativeFunction(symbols["CS::CSEmkEventIns::CSEmkEventIns"], "pointer", [
    "pointer",
    "pointer",
    "pointer",
    "pointer",
    "int",
    "int",
    "int",
]);

const emkEventInsDtor = new NativeFunction(symbols["CS::CSEmkEventIns::~CSEmkEventIns"], "void", [
    "pointer",
]);

const emevdGroupSwitch = new NativeFunction(symbols["EMEVD::EMEVDGroupSwitch"], "bool", [
    "pointer",
    "float",
    "pointer",
]);

const csEmkSystem = symbols["GLOBAL_CSEmkSystem"];

/**
 * Execute a single adhoc EMEVD instruction, returning an condition result if there is one
 * or null otherwise.
 *
 * @param groupId EMEVD group ID, e.g. 2007 for Message
 * @param instructionId EMEVD instruction ID, e.g. 1 for Message - DisplayGenericDialog
 * @param args arguments for the instruction in a C-style aligned struct
 *
 * @see https://soulsmods.github.io/emedf/er-emedf.html for documentation on EMEVD group IDs and
 * instruction IDs
 *
 * @example
 * // SetSpEffect(10000, 500830)
 * const args = Memory.alloc(0x8);
 * args.add(0x0).writeS32(10000);
 * args.add(0x4).writeS32(500830);
 * emevd(2004, 8, args);
 *
 * @example
 * // DisplayBanner(TextBannerType.Commence)
 * const args = Memory.alloc(0x1);
 * args.add(0x0).writeU8(31);
 * emevd(2007, 2, args);
 */
export default function emevd(
    groupId: number,
    instructionId: number,
    args: NativePointer,
): boolean | null {
    const eventId = Memory.alloc(0xc);
    eventId.add(0x0).writeInt(0);
    eventId.add(0x4).writeShort(-1);
    eventId.add(0x8).writeInt(0);

    const unk = Memory.alloc(0x10);
    unk.add(0x0).writePointer(NULL);
    unk.add(0x8).writePointer(NULL);

    const eventArgs = NULL;
    const eventArgsLength = 0;
    const mapId = -1;

    const emkEventIns = Memory.alloc(0x1b0);
    emkEventInsCtor(emkEventIns, eventId, unk, eventArgs, eventArgsLength, mapId, mapId);

    const instruction = Memory.alloc(0x28);
    instruction.add(0x0).writeInt(groupId);
    instruction.add(0x4).writeInt(instructionId);

    const argsStruct = emkEventIns.add(0xa0);
    argsStruct.add(0x30).writePointer(instruction);
    argsStruct.add(0x38).writePointer(args);

    emevdGroupSwitch(csEmkSystem.readPointer().add(0x28).readPointer(), 1 / 30, emkEventIns);

    let result = null;
    const condition = emkEventIns.add(0x58).readPointer();
    if (!condition.isNull()) {
        result = condition.add(0x18).readU8() != 0;
    }

    emkEventInsDtor(emkEventIns);

    return result;
}
