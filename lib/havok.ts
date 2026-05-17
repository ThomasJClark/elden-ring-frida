export abstract class IVec4 {
    abstract x: number;
    abstract y: number;
    abstract z: number;
    abstract w: number;

    multiplyScalar(scalar: number): Vec4 {
        return new Vec4(this.x * scalar, this.y * scalar, this.z * scalar, this.w * scalar);
    }

    multiplyVector(vector: IVec4) {
        const { x, y, z, w } = this;
        this.x = w * vector.x + x * vector.w + y * vector.z - z * vector.y;
        this.y = w * vector.y - x * vector.z + y * vector.w + z * vector.x;
        this.z = w * vector.z + x * vector.y - y * vector.x + z * vector.w;
        this.w = w * vector.w - x * vector.x - y * vector.y - z * vector.z;
    }

    getLength() {
        return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w);
    }

    normalize() {
        const length = this.getLength();
        if (length !== 0) {
            this.x /= length;
            this.y /= length;
            this.z /= length;
            this.w /= length;
        }
    }

    copy() {
        return new Vec4(this.x, this.y, this.z, this.w);
    }
}

/** Vector stored in JavaScript memory */
export class Vec4 extends IVec4 {
    constructor(
        public x: number,
        public y: number,
        public z: number,
        public w: number = 0,
    ) {
        super();
    }
}

/** Handle to a vector stored in game memory */
export class HkVector4 extends IVec4 implements ObjectWrapper {
    handle: NativePointer;

    constructor(handle: NativePointer) {
        super();
        this.handle = handle;
    }

    get x() {
        return this.handle.readFloat();
    }
    set x(value: number) {
        this.handle.writeFloat(value);
    }

    get y() {
        return this.handle.add(0x4).readFloat();
    }
    set y(value: number) {
        this.handle.add(0x4).writeFloat(value);
    }

    get z() {
        return this.handle.add(0x8).readFloat();
    }
    set z(value: number) {
        this.handle.add(0x8).writeFloat(value);
    }

    get w() {
        return this.handle.add(0xc).readFloat();
    }
    set w(value: number) {
        this.handle.add(0xc).writeFloat(value);
    }

    assign(other: IVec4) {
        this.x = other.x;
        this.y = other.y;
        this.z = other.z;
        this.w = other.w;
    }

    toString() {
        return `{${this.x}, ${this.y}, ${this.z}, ${this.w}}`;
    }
}

export class HkQsTransform implements ObjectWrapper {
    handle: NativePointer;

    constructor(handle: NativePointer) {
        this.handle = handle;
    }

    get translation() {
        return new HkVector4(this.handle);
    }
    set translation(value: HkVector4) {
        this.translation.assign(value);
    }

    get rotation() {
        return new HkVector4(this.handle.add(0x10));
    }
    set rotation(value: HkVector4) {
        this.rotation.assign(value);
    }

    get scale() {
        return new HkVector4(this.handle.add(0x20));
    }
    set scale(value: HkVector4) {
        this.scale.assign(value);
    }

    assign(other: HkQsTransform) {
        this.translation.assign(other.translation);
        this.rotation.assign(other.rotation);
        this.scale.assign(other.scale);
    }

    toString() {
        return `hkQsTransform(translation=${this.translation}, rotation=${this.rotation}, scale=${this.scale})`;
    }
}

export class HkaBone implements ObjectWrapper {
    handle: NativePointer;
    skeleton: HkaSkeleton;

    constructor(handle: NativePointer, skeleton: HkaSkeleton) {
        this.handle = handle;
        this.skeleton = skeleton;
    }

    get name() {
        return this.handle.readPointer().readAnsiString();
    }

    get lockTranslation() {
        return this.handle.add(0x8).readU8() != 0;
    }
    set lockTranslation(value: boolean) {
        this.handle.add(0x8).writeU8(value ? 1 : 0);
    }
}

export class BoneWrapper {
    skeleton: HkaSkeleton;
    index: number;

    constructor(skeleton: HkaSkeleton, index: number) {
        this.skeleton = skeleton;
        this.index = index;
    }

    get name() {
        return this.skeleton.hkaBoneAt(this.index).name!;
    }

    get lockTranslation() {
        return this.skeleton.hkaBoneAt(this.index).lockTranslation;
    }
    set lockTranslation(value: boolean) {
        this.skeleton.hkaBoneAt(this.index).lockTranslation = value;
    }

    get referencePose() {
        return this.skeleton.referencePoseAt(this.index);
    }

    get pose() {
        return this.skeleton.poseAt(this.index);
    }
    set pose(value: HkQsTransform) {
        this.pose.assign(value);
    }

    get parent(): BoneWrapper | null {
        const parentIndex = this.skeleton.parentIndexAt(this.index);
        if (parentIndex === -1) return null;
        return new BoneWrapper(this.skeleton, parentIndex);
    }

    toString() {
        return `(${this.name}: lockTranslation=${this.lockTranslation}, pose=${this.pose} referencePose=${this.referencePose})`;
    }
}

export class HkaSkeleton implements ObjectWrapper {
    handle: NativePointer;
    boneDataLayout: NativePointer;

    constructor(handle: NativePointer, boneDataLayout: NativePointer) {
        this.handle = handle;
        this.boneDataLayout = boneDataLayout;
    }

    get boneCount() {
        return this.handle.add(0x28).readInt();
    }

    get bones(): Generator<BoneWrapper> {
        const self = this;
        return (function* () {
            const boneCount = self.boneCount;
            for (let i = 0; i < boneCount; i++) {
                yield new BoneWrapper(self, i);
            }
        })();
    }

    parentIndexAt(index: number) {
        return this.handle
            .add(0x20)
            .readPointer()
            .add(index * 0x2)
            .readShort();
    }

    hkaBoneAt(index: number) {
        return new HkaBone(
            this.handle
                .add(0x30)
                .readPointer()
                .add(index * 0x10),
            this,
        );
    }

    poseAt(index: number) {
        const poses = this.boneDataLayout.add(this.boneDataLayout.add(0x54).readInt());
        return new HkQsTransform(poses.add(index * 0x30));
    }

    referencePoseAt(index: number) {
        const referencePoses = this.handle.add(0x40).readPointer();
        return new HkQsTransform(referencePoses.add(index * 0x30));
    }
}

export class HkbCharacter implements ObjectWrapper {
    handle: NativePointer;

    constructor(handle: NativePointer) {
        this.handle = handle;
    }

    get skeleton() {
        return new HkaSkeleton(
            this.handle.add(0x90).readPointer().add(0x28).readPointer(),
            this.handle.add(0x38).readPointer().readPointer(),
        );
    }
}
