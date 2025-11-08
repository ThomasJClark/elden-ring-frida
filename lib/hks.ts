import symbols from "./symbols.js";

export const lua_call = new NativeFunction(symbols["hkbInternal::hksi_lua_call"], "void", [
    "pointer",
    "int",
    "int",
]);

export const lua_getglobal = new NativeFunction(
    symbols["hkbInternal::hksi_lua_getglobal"],
    "void",
    ["pointer", "pointer"],
);

export const lua_pushnil = new NativeFunction(symbols["hkbInternal::hksi_lua_pushnil"], "void", [
    "pointer",
]);

export const lua_pushnumber = new NativeFunction(
    symbols["hkbInternal::hksi_lua_pushnumber"],
    "void",
    ["pointer", "float"],
);

export const lua_pushstring = new NativeFunction(
    symbols["hkbInternal::hksi_lua_pushstring"],
    "void",
    ["pointer", "pointer"],
);
