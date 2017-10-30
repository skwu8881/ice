(function() {

    'use strict';

    dmx.lightbox = {
        count: 0,
        gallery: {},
        options: {
            fullscreen: false,
            noscrollbars: false,
            autoplay: false,
            loopvideo: false,
            buttons: 'auto',
            animation: 'slide',
            spinner: 'Spinner1'
        }
    };

    var overlay, slider, prevButton, nextButton, closeButton, lastFocus, currentGallery, currentIndex;
    var classPrefix = 'dmxLightbox';
    var touch = { count: 0 };

    dmx.lightbox.register = function(component) {
        if (dmx.lightbox.component) {
            return console.warn('Only 1 lightbox component should be used on the page!');
        }
        dmx.lightbox.component = component;
    };

    dmx.lightbox.getGallery = function(name) {
        if (!dmx.lightbox.gallery[name]) {
            dmx.lightbox.gallery[name] = {
                nodes: [],
                images: []
            };
        }

        return dmx.lightbox.gallery[name];
    };

    dmx.lightbox.addToGallery = function(name, node) {
        var gallery = dmx.lightbox.getGallery(name);
        gallery.nodes.push(node);
    };

    dmx.lightbox.setOptions = function(newOptions) {
        dmx.lightbox.options = dmx.extend(dmx.lightbox.options, newOptions);
    };

    dmx.lightbox.run = function(name, node) {
        var gallery = dmx.lightbox.gallery[name];

        if (!gallery) {
            return alert('Gallery ' + name + ' does not exist.');
        }

        if (!overlay) {
            setup();
        }

        if (currentGallery !== gallery) {
            prepareOverlay(gallery);
        }

        showOverlay(gallery.nodes.indexOf(node));
    };

    function setup() {
        overlay = createElement('div', {
            class: classes('Overlay'),
            role: 'dialog'
        });

        slider = createElement('div', {
            class: classes('Slider')
        });

        prevButton = createElement('button', {
            class: classes('Button', 'Prev'),
            type: 'button',
            'aria-label': 'Previous'
        });

        nextButton = createElement('button', {
            class: classes('Button', 'Next'),
            type: 'button',
            'aria-label': 'Next'
        });

        closeButton = createElement('button', {
            class: classes('Button', 'Close'),
            type: 'button',
            'aria-label': 'Close'
        });

        overlay.appendChild(slider);
        overlay.appendChild(prevButton);
        overlay.appendChild(nextButton);
        overlay.appendChild(closeButton);

        document.body.appendChild(overlay);

        document.addEventListener('focus', focusHandler, true);
        document.addEventListener('fullscreenchange', fullscreenHandler);

        overlay.addEventListener('click', overlayClickHandler);
        prevButton.addEventListener('click', prevButtonClickHandler);
        nextButton.addEventListener('click', nextButtonClickHandler);
        closeButton.addEventListener('click', closeButtonClickHandler);

        overlay.addEventListener('touchstart', touchstartHandler);
        overlay.addEventListener('touchend', touchendHandler);
        overlay.addEventListener('touchmove', touchmoveHandler);
    };

    function showOverlay(index) {
        if (dmx.lightbox.options.noscrollbars) {
            document.documentElement.style.setProperty('overflow', 'hidden');
            document.body.style.setProperty('overflow', 'scroll');
        }

        if (isVisible()) {
            return;
        }

        document.addEventListener('keydown', keydownHandler);

        currentIndex = index;

        loadImage(index, function() {
            preloadNext(index);
            preloadPrev(index);
        });

        updateOffset(index);

        overlay.style.setProperty('display', 'block');

        if (dmx.lightbox.options.fullscreen && overlay.requestFullscreen) {
            overlay.requestFullscreen();
        }

        setTimeout(function() {
            overlay.classList.add(classPrefix + 'Visible');
            if (dmx.lightbox.component) {
                dmx.lightbox.component.dispatchEvent('show');
            }
        }, 50);

        lastFocus = document.activeElement;
        initFocus();
    }

    function hideOverlay() {
        if (!isVisible()) {
            return;
        }

        // pause video
        var vids = overlay.getElementsByTagName('video');
        for (var i = 0; i < vids.length; i++) {
            if (!vids[i].paused) {
                vids[i].pause();
            }
        }

        if (dmx.lightbox.options.noscrollbars) {
            document.documentElement.style.removeProperty('overflow');
            document.body.style.removeProperty('overflow');
        }

        document.removeEventListener('keydown', keydownHandler);

        overlay.classList.remove(classPrefix + 'Visible');
        setTimeout(function() {
            overlay.style.removeProperty('display');
            if (document.fullscreenElement) {
                document.exitFullscreen();
            }
            if (dmx.lightbox.component) {
                dmx.lightbox.component.dispatchEvent('hide');
            }
        }, 500);
        lastFocus.focus();
    }

    function isVisible() {
        return overlay.style.display === 'block';
    }

    function exitFullscreen() {
        document.exitFullscreen();
    }

    function showPrevImage() {
        if (currentIndex >= 1) {
            currentIndex--;
            updateOffset();
            preloadPrev(currentIndex);
        } else if (dmx.lightbox.options.animation !== 'none') {
            slider.classList.add(classPrefix + 'BounceLeft');
            setTimeout(function() {
                slider.classList.remove(classPrefix + 'BounceLeft');
            }, 400);
        }
    }

    function showNextImage() {
        if (currentIndex <= currentGallery.images.length - 2) {
            currentIndex++;
            updateOffset();
            preloadNext(currentIndex);
        } else if (dmx.lightbox.options.animation !== 'none') {
            slider.classList.add(classPrefix + 'BounceRight');
            setTimeout(function() {
                slider.classList.remove(classPrefix + 'BounceRight');
            }, 400);
        }
    }

    function preloadPrev(index) {
        loadImage(index - 1, function() {
            preloadPrev(index - 1);
        })
    }

    function preloadNext(index) {
        loadImage(index + 1, function() {
            preloadNext(index + 1);
        })
    }

    function prepareOverlay(gallery) {
        currentGallery = gallery;

        setOptions();

        while (slider.firstChild) {
            slider.removeChild(slider.firstChild);
        }

        var figureIds = [];
        var captionIds = [];

        for (var i = 0; i < gallery.nodes.length; i++) {
            if (!gallery.images[i]) {
                gallery.images.push(createElement('div', {
                    id: classPrefix + 'Image' + i,
                    class: classPrefix + 'Image'
                }));
            }

            figureIds.push(classPrefix + 'Figure' + i);
            captionIds.push(classPrefix + 'Caption' + i);
            slider.appendChild(gallery.images[i]);
        }

        overlay.setAttribute('aria-labelledby', figureIds.join(' '));
        overlay.setAttribute('aria-describedby', captionIds.join(' '));
    }

    function setOptions() {
        var options = dmx.extend(dmx.lightbox.options);

        slider.style.transition = (options.animation === 'fade' ? 'opacity .4s ease' : options.animation === 'slide' ? '' : 'none');

        if (options.buttons === 'auto' && ('ontouchstart' in window || currentGallery.nodes.length === 1)) {
            options.buttons = 'hide';
        }

        prevButton.style.display = nextButton.style.display = (options.buttons === 'hide' ? 'none' : '');
    }

    function initFocus() {
        if (dmx.lightbox.options.buttons !== 'hide') {
            prevButton.focus();
        } else {
            closeButton.focus();
        }
    }

    function loadImage(index, callback) {
        var container = currentGallery.images[index];
        var node = currentGallery.nodes[index];

        if (!container || !node) {
            return;
        }

        if (container.getElementsByTagName('figure')[0]) {
            if (callback) callback();
            if (dmx.lightbox.options.autoplay) {
                var vids = overlay.getElementsByTagName('video');
                for (var i = 0; i < vids.length; i++) {
                    if (vids[i] == container.querySelector('video')) {
                        vids[i].play();
                    } else if (!vids[i].paused) {
                        vids[i].pause();
                    }
                }
            }
            return
        }

        var figure = createElement('figure', {
            id: classPrefix + 'Figure' + index
        });

        var spinner = createElement('div', {
            class: classes('Spinner', dmx.lightbox.options.spinner)
        });

        figure.appendChild(spinner);

        if (node.title) {
            figure.appendChild(createElement('figcaption', {
                id: classPrefix + 'Caption' + index
            }, node.title));
        }

        if (/\.(jpe?g|gif|png)$/i.test(node.href)) {
            var img = createElement('img');
            img.onload = function() {
                figure.removeChild(spinner);
                if (callback) callback();
            };
            img.setAttribute('src', node.href);
            figure.appendChild(img);
        } else if (/\.(mp4)$/i.test(node.href)) {
            var vid = createElement('video');
            vid.controls = true;
            vid.loop = dmx.lightbox.options.loopvideo;
            var src = createElement('source', {
                src: node.href
            });
            vid.addEventListener('canplay', function canplay() {
                vid.removeEventListener('canplay', canplay);
                figure.removeChild(spinner);
                if (callback) callback();
                if (dmx.lightbox.options.autoplay && currentIndex === index) {
                    vid.play();
                }
            });
            vid.appendChild(src);
            figure.appendChild(vid);
        } else {
            figure.appendChild(createElement('div', {}, '<a href="' + node.href + '">Url not supported</a>'))
            figure.removeChild(spinner);
            if (callback) callback();
        }

        container.appendChild(figure);
    }

    function updateOffset() {
        var transform = 'translate3d(' + (-currentIndex * 100) + '%,0,0)';

        if (dmx.lightbox.options.animation === 'fade') {
            slider.style.setProperty('opacity', 0);
            setTimeout(function() {
                slider.style.setProperty('transform', transform);
                slider.style.setProperty('opacity', 1);
            }, 400);
        } else {
            slider.style.setProperty('transform', transform);
        }
    }

    // Event handlers

    function focusHandler(event) {
        if (isVisible() && !overlay.contains(event.target)) {
            event.stopPropagation();
            initFocus();
        }
    }

    function fullscreenHandler(event) {
        if (!document.fullscreenElement) {
            hideOverlay();
        }
    }

    function keydownHandler(event) {
        switch (event.keyCode) {
            case 37: // Left arrow
                showPrevImage();
                break;
            case 39: // Right arrow
                showNextImage();
                break;
            case 27: // Esc
                hideOverlay();
                break;
        }
    }

    function overlayClickHandler(event) {
        if (event.target.id.indexOf('dmxLightboxImage') !== -1) {
            hideOverlay();
        }
    }

    function prevButtonClickHandler(event) {
        event.stopPropagation();
        showPrevImage();
    }

    function nextButtonClickHandler(event) {
        event.stopPropagation();
        showNextImage();
    }

    function closeButtonClickHandler(event) {
        event.stopPropagation();
        hideOverlay();
    }

    function touchstartHandler(event) {
        touch.count++;
        touch.startX = event.changedTouches[0].pageX;
        touch.startY = event.changedTouches[0].pageY;
    }

    function touchendHandler(event) {
        touch.count--;
        touch.done = false;
    }

    function touchmoveHandler(event) {
        if (touch.done || touch.count > 1) return;

        event.preventDefault();

        var x = event.changedTouches[0].pageX;
        var y = event.changedTouches[0].pageY;

        if (x - touch.startX > 40) {
            touch.done = true;
            showPrevImage();
        } else if (touch.startX - x > 40) {
            touch.done = true;
            showNextImage();
        } else if (touch.startY - y > 100) {
            hideOverlay();
        }
    }

    // Helper methods

    function createElement(tag, attrs, html) {
        var elm = document.createElement(tag);
        if (attrs) {
            Object.keys(attrs).forEach(function(name) {
                elm.setAttribute(name, attrs[name]);
            });
        }
        if (html) {
            elm.innerHTML = html;
        }
        return elm;
    }

    function classes() {
        return classPrefix + [].join.call(arguments, ' ' + classPrefix);
    }

})();
