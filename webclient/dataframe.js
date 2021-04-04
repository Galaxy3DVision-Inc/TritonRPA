class DataFrame
{
    constructor()
    {
        this.headsize = 160;
        this.type = 0;
        this.dataSize = 0;
        this.sourceId = 0;
        this.startTime = 0;
        this.format = [0, 0, 0, 0, 0, 0, 0, 0];
        this.srcAddr = 0;
        this.dstAddr = 0;
        this.metadata0 = 0;
        this.metadata1 = 0;
        this.metadata2 = 0;
        this.metadata3 = 0;
        this.refID = 0;
        this.refIndex = 0;
        this.vLink = 0;
        this.version = 0;
        this.dataItemNum = 0;
        this.data = null;
    }
    from(arydata)
    {
        var dv = new DataView(arydata.buffer);
        var offset = 0;
        var type0 = dv.getUint32(offset);
        this.type = dv.getUint32(offset, true);
        offset += 4;
        this.dataSize = dv.getUint32(offset, true);
        offset += 4;
        this.sourceId = dv.getBigUint64(offset, true);
        offset += 8;
        this.startTime = dv.getBigUint64(offset, true);
        offset += 8;
        for (var i = 0; i < 8; i++)
        {
            this.format[i] = dv.getBigUint64(offset, true);
            offset += 8;
        }
        this.srcAddr = dv.getBigUint64(offset, true);
        offset += 8;
        this.dstAddr = dv.getBigUint64(offset, true);
        offset += 8;
        this.metadata0 = dv.getBigUint64(offset, true);
        offset += 8;
        this.metadata1 = dv.getBigUint64(offset, true);
        offset += 8;
        this.metadata2 = dv.getBigUint64(offset, true);
        offset += 8;
        this.metadata3 = dv.getBigUint64(offset, true);
        offset += 8;
        this.refID = dv.getUint32(offset, true);
        offset += 4;
        this.refIndex = dv.getUint32(offset, true);
        offset += 4;
        this.vLink = dv.getBigUint64(offset, true);
        offset += 8;
        this.version = dv.getUint32(offset, true);
        offset += 4;
        this.dataItemNum = dv.getUint32(offset, true);
        offset += 4;
        if (this.dataSize > 0) {
            this.data = new Uint8Array(
                arydata.subarray(this.headsize, this.headsize + this.dataSize));
        }
    }
    to()
    {
        var buf = new ArrayBuffer(this.headsize + this.dataSize);
        var dv = new DataView(buf);
        var offset = 0;
        dv.setUint32(offset, this.type, true);
        offset += 4;
        dv.setUint32(offset, this.dataSize, true);
        offset += 4;
        dv.setBigUint64(offset, BigInt(this.sourceId), true);
        offset += 8;
        dv.setBigUint64(offset, BigInt(this.startTime), true);
        offset += 8;
        for (var i = 0; i < 8; i++)
        {
            dv.setBigUint64(offset, BigInt(this.format[i]), true);
            offset += 8;
        }
        dv.setBigUint64(offset, BigInt(this.srcAddr), true);
        offset += 8;
        dv.setBigUint64(offset, BigInt(this.dstAddr), true);
        offset += 8;
        dv.setBigUint64(offset, BigInt(this.metadata0), true);
        offset += 8;
        dv.setBigUint64(offset, BigInt(this.metadata1), true);
        offset += 8;
        dv.setBigUint64(offset, BigInt(this.metadata2), true);
        offset += 8;
        dv.setBigUint64(offset, BigInt(this.metadata3), true);
        offset += 8;
        dv.setUint32(offset, this.refID, true);
        offset += 4;
        dv.setUint32(offset, this.refIndex, true);
        offset += 4;
        dv.setBigUint64(offset, BigInt(this.vLink), true);
        offset += 8;
        dv.setUint32(offset, this.version, true);
        offset += 4;
        dv.setUint32(offset, this.dataItemNum, true);
        offset += 4;
        var buf0 = new Uint8Array(buf);
        if (this.dataSize > 0) {
            buf0.set(this.data, this.headsize);
        }
        return buf0;
    }
}