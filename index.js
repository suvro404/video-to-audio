module.exports.convert = function (videoFileData, targetAudioFormat) {
    try {
        targetAudioFormat = targetAudioFormat.toLowerCase();
        let reader = new FileReader();
        return new Promise(resolve => {
            reader.onload = function (event) {
                let contentType = 'audio/'+targetAudioFormat;
                let audioContext = new(window.AudioContext || window.webkitAudioContext)();
                let myBuffer;
                const sampleRate = 16000;
                const numberOfChannels = 1;
                let videoFileAsBuffer = reader.result;
                audioContext.decodeAudioData(videoFileAsBuffer).then(function (decodedAudioData) {
                    let duration = decodedAudioData.duration;
                    let offlineAudioContext = new OfflineAudioContext(numberOfChannels, sampleRate * duration, sampleRate);
                    let soundSource = offlineAudioContext.createBufferSource();
                    myBuffer = decodedAudioData;
                    soundSource.buffer = myBuffer;
                    soundSource.connect(offlineAudioContext.destination);
                    soundSource.start();
                    offlineAudioContext.startRendering().then(function (renderedBuffer) {
                        let UintWave = createWaveFileData(renderedBuffer);
                        let b64Data = btoa(uint8ToString(UintWave));
                        let blob = getBlobFromBase64Data(b64Data, contentType);
                        let blobUrl = URL.createObjectURL(blob);

                        let convertedAudio = {
                            name: videoFileData.name.substring(0,videoFileData.name.lastIndexOf(".")),
                            format: targetAudioFormat,
                            data: blobUrl
                        }
                        resolve(convertedAudio);
                    }).catch(function (err) {
                        console.log('Rendering failed: ' + err);
                    });
                });

            }
            reader.readAsArrayBuffer(videoFileData);
        });

    } catch (e) {
        console.log("Error occurred while converting : ", e);
    }
}

function getBlobFromBase64Data(b64Data, contentType, sliceSize=512) {
    const byteCharacters = atob(b64Data);
    const byteArrays = [];

    for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
        const slice = byteCharacters.slice(offset, offset + sliceSize);

        const byteNumbers = new Array(slice.length);
        for (let i = 0; i < slice.length; i++) {
            byteNumbers[i] = slice.charCodeAt(i);
        }

        const byteArray = new Uint8Array(byteNumbers);
        byteArrays.push(byteArray);
    }

    const blob = new Blob(byteArrays, {type: contentType});
    return blob;
}

function createWaveFileData(audioBuffer) {
    var frameLength = audioBuffer.length;
    var numberOfChannels = audioBuffer.numberOfChannels;
    var sampleRate = audioBuffer.sampleRate;
    var bitsPerSample = 16;
    var byteRate = sampleRate * numberOfChannels * bitsPerSample/8;
    var blockAlign = numberOfChannels * bitsPerSample/8;
    var wavDataByteLength = frameLength * numberOfChannels * 2;
    var headerByteLength = 44;
    var totalLength = headerByteLength + wavDataByteLength;

    var waveFileData = new Uint8Array(totalLength);

    var subChunk1Size = 16;
    var subChunk2Size = wavDataByteLength;
    var chunkSize = 4 + (8 + subChunk1Size) + (8 + subChunk2Size);

    writeString("RIFF", waveFileData, 0);
    writeInt32(chunkSize, waveFileData, 4);
    writeString("WAVE", waveFileData, 8);
    writeString("fmt ", waveFileData, 12);

    writeInt32(subChunk1Size, waveFileData, 16);
    writeInt16(1, waveFileData, 20);
    writeInt16(numberOfChannels, waveFileData, 22);
    writeInt32(sampleRate, waveFileData, 24);
    writeInt32(byteRate, waveFileData, 28);
    writeInt16(blockAlign, waveFileData, 32);
    writeInt32(bitsPerSample, waveFileData, 34);

    writeString("data", waveFileData, 36);
    writeInt32(subChunk2Size, waveFileData, 40);


    writeAudioBuffer(audioBuffer, waveFileData, 44);

    return waveFileData;

}

function writeString(s, a, offset) {
    for (var i = 0; i < s.length; ++i) {
        a[offset + i] = s.charCodeAt(i);
    }
}

function writeInt16(n, a, offset) {
    n = Math.floor(n);

    var b1 = n & 255;
    var b2 = (n >> 8) & 255;

    a[offset + 0] = b1;
    a[offset + 1] = b2;
}

function writeInt32(n, a, offset) {
    n = Math.floor(n);
    var b1 = n & 255;
    var b2 = (n >> 8) & 255;
    var b3 = (n >> 16) & 255;
    var b4 = (n >> 24) & 255;

    a[offset + 0] = b1;
    a[offset + 1] = b2;
    a[offset + 2] = b3;
    a[offset + 3] = b4;
}

function writeAudioBuffer(audioBuffer, a, offset) {
    var n = audioBuffer.length;
    var channels = audioBuffer.numberOfChannels;

    for (var i = 0; i < n; ++i) {
        for (var k = 0; k < channels; ++k) {
            var buffer = audioBuffer.getChannelData(k);
            var sample = buffer[i] * 32768.0;

            if (sample < -32768)
                sample = -32768;
            if (sample > 32767)
                sample = 32767;

            writeInt16(sample, a, offset);
            offset += 2;
        }
    }
}

function uint8ToString(buf) {
    var i, length, out = '';
    for (i = 0, length = buf.length; i < length; i += 1) {
        out += String.fromCharCode(buf[i]);
    }
    return out;
}