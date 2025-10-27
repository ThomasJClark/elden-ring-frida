# Shared Frida utilities for Elden Ring

Utilities for instrumenting Elden Ring and other FromSoftware games using [Frida](https://frida.re/).

## Usage

1. `me3 launch --game eldenring --disable-arxan true`
2. `frida -n eldenring.exe -l index.ts`
3. Add your instrumentation code to `index.ts`
