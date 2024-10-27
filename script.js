class ChannelPlayer {
    constructor() {
        this.container = document.getElementById('channel-container');
        this.playerContainer = document.getElementById('video-player-container');
        this.videoPlayer = document.getElementById('video-player');
        this.closeButton = document.getElementById('close-button');
        this.loadingSpinner = document.getElementById('loading-spinner');
        this.errorMessage = document.getElementById('error-message');
        this.statusMessage = document.getElementById('status-message');

        this.plyr = new Plyr(this.videoPlayer); // تهيئة مكتبة Plyr
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        this.closeButton.addEventListener('click', () => this.closePlayer());
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.closePlayer();
        });

        this.videoPlayer.addEventListener('playing', () => {
            this.loadingSpinner.style.display = 'none';
            this.statusMessage.textContent = '';
        });

        this.videoPlayer.addEventListener('waiting', () => {
            this.loadingSpinner.style.display = 'block';
            this.statusMessage.textContent = 'يتم تحميل البث...';
        });

        this.videoPlayer.addEventListener('error', () => {
            this.handleVideoError();
        });
    }

    async loadChannels() {
        try {
            const response = await fetch('https://raw.githubusercontent.com/ghaith-99/ghaith-99/refs/heads/main/mytv.json');
            if (!response.ok) throw new Error('Network response was not ok');
            
            const data = await response.json();
            this.renderChannels(data);
        } catch (error) {
            console.error('Error loading channels:', error);
            this.errorMessage.style.display = 'block';
        }
    }

    renderChannels(channels) {
        this.container.innerHTML = '';
        channels.forEach(channel => {
            const channelElement = this.createChannelElement(channel);
            this.container.appendChild(channelElement);
        });
    }

    createChannelElement(channel) {
        const channelDiv = document.createElement('div');
        channelDiv.className = 'channel';

        if (channel.logo) {
            const logo = document.createElement('img');
            logo.src = channel.logo;
            logo.alt = channel.channel || 'شعار القناة';
            logo.loading = 'lazy';
            channelDiv.appendChild(logo);
        }

        const title = document.createElement('h3');
        title.textContent = channel.channel || 'اسم القناة';
        channelDiv.appendChild(title);

        if (channel.url) {
            const button = document.createElement('button');
            button.className = 'watch-button';
            button.textContent = 'مشاهدة البث';
            button.addEventListener('click', () => this.playChannel(channel.url));
            channelDiv.appendChild(button);
        }

        return channelDiv;
    }

    playChannel(url) {
        this.loadingSpinner.style.display = 'block';
        this.playerContainer.style.display = 'flex';

        if (Hls.isSupported()) {
            const hls = new Hls();
            hls.loadSource(url);
            hls.attachMedia(this.videoPlayer);
            this.plyr.play(); // تشغيل Plyr بعد تحميل HLS
            
            hls.on(Hls.Events.ERROR, (event, data) => {
                if (data.fatal) {
                    this.handleVideoError();
                }
            });
        } else if (this.videoPlayer.canPlayType('application/vnd.apple.mpegurl')) {
            this.videoPlayer.src = url;
            this.plyr.play();
        } else {
            this.handleVideoError();
            return;
        }

        this.requestFullscreen();
    }

    requestFullscreen() {
        if (this.videoPlayer.requestFullscreen) {
            this.videoPlayer.requestFullscreen();
        } else if (this.videoPlayer.webkitRequestFullscreen) {
            this.videoPlayer.webkitRequestFullscreen();
        } else if (this.videoPlayer.msRequestFullscreen) {
            this.videoPlayer.msRequestFullscreen();
        }
    }

    closePlayer() {
        this.plyr.pause();
        this.playerContainer.style.display = 'none';
        this.videoPlayer.src = '';
        this.loadingSpinner.style.display = 'none';
        this.statusMessage.textContent = '';

        if (document.fullscreenElement) {
            document.exitFullscreen();
        }
    }

    handleVideoError() {
        this.loadingSpinner.style.display = 'none';
        this.statusMessage.textContent = 'عذراً، حدث خطأ في تشغيل البث. يرجى المحاولة مرة أخرى لاحقاً.';
        this.closePlayer();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const player = new ChannelPlayer();
    player.loadChannels();
});
