
const charx = 88;
const charw = 87;
const packheadSize = 12;
const PACKET_SIZE = 48 * 1024 - packheadSize;

class WsConnect
{
    constructor()
	{
        this.url = "ws://localhost:7681";
        this.protocol = "lws-minimal";
		this.ws = null;
		this.onopen = null;
		this.onclose = null;
		this.onframe = null;
		this.dataIndex = 0;
		this.mFrmCnt = 0;

		//for packet parse
		this.mHeadFillSize = 0;
		this.mDataFillSize = 0;
		this.mPackBufSize = 0;
		this.mPackFillSize = 0;
		this.mDataBuf = new Uint8Array(PACKET_SIZE);
		this.mHead = new Uint8Array(packheadSize);
		this.mPackBuffer = null;
	}
	getCurTime()
	{
		var d = new Date();
		var n = d.getTime();//miliseconds
		return n;
	}
	MedType(strType)
	{
		if (strType.length < 4)
		{
			return 0;
		}
		var ret0 = strType.charCodeAt(0);
		ret0 <<= 24;
		var ret1 = strType.charCodeAt(1);
		ret1 <<= 16;
		var ret2 =  strType.charCodeAt(2);
		ret2 <<= 8;
		var ret3 =  strType.charCodeAt(3);

		var ret = ret0|ret1|ret2|ret3;
		return ret;
	}
	MediaTypeStr(tp)
	{
		var tp0 = (tp >> 24)&0xff;
		var tp1 = (tp >> 16)&0xff;
		var tp2 = (tp >> 8) & 0xff;
		var tp3 = tp & 0xff;
		var ret =  String.fromCharCode(tp0) +
			String.fromCharCode(tp1) +
			String.fromCharCode(tp2) +
			String.fromCharCode(tp3);
		return ret;
	}
	SendHeartBeat()
	{
		var f = new DataFrame();
		f.type = DataFrameType.PascalToNeumann_Heart;
		f.sourceIndex = 0;
		f.startTime = this.getCurTime();
		f.dataSize = 0;
		this.send(f);
    }
	PackRegFrameTypeFrames(regKeys)
	{
		var f = new DataFrame();
		f.type = DataFrameType.Framework_ClientRegFrameTypes;
		f.sourceIndex = 0;
		f.startTime = this.getCurTime();
		f.dataSize = regKeys.length * 16;
		var buf = new ArrayBuffer(f.dataSize);
		var dv = new DataView(buf);
		var offset = 0;
		regKeys.forEach(item =>{
			dv.setBigUint64(offset, BigInt(item[0]), true);
			offset += 8;
			dv.setBigUint64(offset, BigInt(item[1]), true);
			offset += 8;
		});
		f.data = new Uint8Array(buf);
		return f;
	}
	RegisterFrameTypesToPascal(regKeys)
	{
		this.send(this.PackRegFrameTypeFrames(regKeys));
    }
    connect()
	{
		var ws0 = new WebSocket(this.url, this.protocol);
		this.ws = ws0;
		var self = this;//very tricky here,this will be change during callback,
		//so keep as self variable
		try
		{
			ws0.onopen = function ()
			{
				if (self.onopen != null)
				{
					self.onopen();
				}
			};

			ws0.onmessage = function(msg)
			{
				const reader = new FileReader();
				reader.addEventListener('loadend', () =>
				{
					// reader.result contains the contents of blob as a typed array
					self.Parse(reader.result, msg.data.size);
				});
				reader.readAsArrayBuffer(msg.data);
			};

			ws0.onclose = function ()
			{
				if (self.onclose != null) {
					self.onclose();
				}
			};
		}
		catch (exception)
		{
			alert("<p>Error " + exception);
		}

		window.setInterval
		(
			function ()
			{
				self.SendHeartBeat();
			}, 3000
		);
	}
	Parse(data, size)
	{
		var dataOffset = 0;
		var aryData = new Uint8Array(data);
		while (size > 0)
		{
			if (this.mHeadFillSize < packheadSize) {
				var needSize = packheadSize - this.mHeadFillSize;
				if (needSize > size) {
					needSize = size;
				}
				if (needSize > 0) {
					this.mHead.set(aryData.subarray(
						dataOffset, dataOffset+needSize),
						this.mHeadFillSize);
					this.mHeadFillSize += needSize;
					size -= needSize;
					dataOffset += needSize;
				}
			}
			if (this.mHeadFillSize < packheadSize) {
				return;
			}
			var dvHead = new DataView(this.mHead.buffer);
			var h1 = dvHead.getUint8(0);
			var h2 = dvHead.getUint8(1);
			if (h1 != charx || h2 != charw)
			{
				this.mDataFillSize = 0;
				this.mHeadFillSize = 0;
				return;
			}
			var headDataIndex = dvHead.getUint16(2, true);
			var headDataSize = dvHead.getUint32(4, true);
			var headPackIndex = dvHead.getUint16(8, true);
			var headPacketSize = dvHead.getUint16(10, true);

			//Head is ready
			if (this.mDataIdx != -1
				&& this.mDataIdx != headDataIndex)
			{
				this.mPackFillSize = 0;
			}
			this.mDataIdx = headDataIndex;
			var packSize = headPacketSize;
			if (this.mDataFillSize < packSize)
			{
				var needSize = packSize - this.mDataFillSize;
				if (needSize > size)
				{
					needSize = size;
				}
				if (needSize > 0)
				{
					this.mDataBuf.set(
						aryData.subarray(
							dataOffset, dataOffset+needSize),
						this.mDataFillSize);
					this.mDataFillSize += needSize;
					size -= needSize;
					dataOffset += needSize;
				}
			}
			if (this.mDataFillSize == packSize)
			{
				//Get one packet
				if (this.mPackBuffer == null)
				{
					this.mPackBufSize = headDataSize;
					this.mPackBuffer = new Uint8Array(this.mPackBufSize);
				}
				else if (this.mPackBufSize < headDataSize)
				{
					this.mPackBufSize = headDataSize;
					this.mPackBuffer = new Uint8Array(this.mPackBufSize);
				}
				this.mPackBuffer.set(
					this.mDataBuf.subarray(0, packSize),
					PACKET_SIZE * headPackIndex);
				this.mPackFillSize += packSize;
				if (this.mPackFillSize == headDataSize)
				{//Filled up for current pack
					this.PushFrame();
					this.mPackFillSize = 0;
					this.mDataIdx = -1;
				}
				//Reset to next packet
				this.mDataFillSize = 0;
				this.mHeadFillSize = 0;
			}
		}//end while
	}//end function

	PushFrame()
	{
		var frm = new DataFrame();
		frm.from(this.mPackBuffer);
		this.onframe(frm);
		this.mFrmCnt++;
    }
	senddata(data)
	{
		var allSize = data.length;
		var buf = new ArrayBuffer(PACKET_SIZE + packheadSize);
		var pack = new DataView(buf);
		pack.setUint8(0, charx);
		pack.setUint8(1, charw);
		pack.setUint16(2, ++this.dataIndex,true);
		pack.setUint32(4, allSize, true);
		var packData = new Uint8Array(buf, packheadSize);

		var PackNum = Math.floor((allSize + PACKET_SIZE - 1) / PACKET_SIZE);
		for (var i = 0; i < PackNum; i++)
		{
			var nPacketSize = PACKET_SIZE;
			var offset = i * PACKET_SIZE;
			if (i == PackNum - 1)
			{
				nPacketSize = allSize - offset;
			}
			pack.setUint16(8, i, true);//PackIndex
			pack.setUint16(10, nPacketSize, true);//PackIndex

			packData.set(data.subarray(offset, offset+nPacketSize));
			var ourData = new Uint8Array(buf, 0, packheadSize+nPacketSize);
			this.ws.send(ourData);
        }
    }
	send(frm)
	{
		this.senddata(frm.to());
    }
}