## video-to-audio
##### A lightweight video to audio conversion tool to convert mp4, avi and mov file to mp3, wav and aac file.

### [DEMO](https://suvro404.github.io/video-to-audio-playground/)

#### Install
```
npm install video-to-audio
```

### Usage
```
import VideoToAudio from 'video-to-audio'

VideoToAudio.convert(sourceVideoFile, targetAudioFormat);
```

### Example Code
```
<input type='file' accept=".mp4, .avi, .mov" onchange="convertToAudio(this)" />

import VideoToAudio from 'video-to-audio'

async function convertToAudio(input) {
    let sourceVideoFile = input.files[0];
    let targetAudioFormat = 'mp3'
    let convertedAudioDataObj = await VideoToAudio.convert(sourceVideoFile, targetAudioFormat);
}
```
##### This convert function will return a converted audio data object which includes audio name, format and blob URL.
##### This blob URL can be used to download the converted audio.

```
function downloadAudio(convertedAudioDataObj) {
    let a = document.createElement("a");
    a.href = convertedAudioDataObj.data;
    a.download = convertedAudioDataObj.name + "." + convertedAudioDataObj.format;
    a.click();
}
```


### License
MIT