(function () {
    const track = document.getElementById('cs-track');
    const thumb = document.getElementById('cs-thumb');
    const containerScroll = document.getElementById('customScrollbar');

    let dragging = false;
    let startY = 0;
    let startThumbTop = 0;

    function isScrollable() {
      return document.documentElement.scrollHeight > window.innerHeight + 1;
    }

    function updateThumb() {
      if (!isScrollable()) {
        containerScroll.classList.add('hidden');
        return;
      } else {
        containerScroll.classList.remove('hidden');
      }

      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = window.innerHeight;
      const trackHeight = track.clientHeight;

      const minThumb = 28;
      const thumbHeight = Math.max((clientHeight / scrollHeight) * trackHeight, minThumb);
      thumb.style.height = thumbHeight + "px";

      const maxThumbTop = trackHeight - thumbHeight;
      const scrollTop = window.scrollY;
      const thumbTop = (scrollTop / (scrollHeight - clientHeight)) * maxThumbTop;

      thumb.style.transform = `translateY(${thumbTop}px)`;
    }

    thumb.addEventListener("pointerdown", e => {
      dragging = true;
      thumb.classList.add("dragging");

      startY = e.clientY;
      const match = thumb.style.transform.match(/translateY\(([-\d.]+)px\)/);
      startThumbTop = match ? parseFloat(match[1]) : 0;

      document.addEventListener("pointermove", move);
      document.addEventListener("pointerup", stop);
    });

    function move(e) {
      if (!dragging) return;

      const dy = e.clientY - startY;
      const trackHeight = track.clientHeight;
      const thumbHeight = thumb.clientHeight;

      let newTop = startThumbTop + dy;
      newTop = Math.max(0, Math.min(trackHeight - thumbHeight, newTop));

      const proportion = newTop / (trackHeight - thumbHeight);
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = window.innerHeight;

      window.scrollTo({ top: proportion * (scrollHeight - clientHeight), behavior: "auto" });
    }

    function stop() {
      dragging = false;
      thumb.classList.remove("dragging");

      document.removeEventListener("pointermove", move);
      document.removeEventListener("pointerup", stop);
    }

    track.addEventListener("click", e => {
      if (e.target !== track) return;

      const rect = track.getBoundingClientRect();
      const clickY = e.clientY - rect.top;

      const thumbHeight = thumb.clientHeight;
      const trackHeight = track.clientHeight;

      const newTop = Math.max(0, Math.min(trackHeight - thumbHeight, clickY - thumbHeight / 2));

      const proportion = newTop / (trackHeight - thumbHeight);
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = window.innerHeight;

      window.scrollTo({ top: proportion * (scrollHeight - clientHeight), behavior: "smooth" });
    });

    window.addEventListener("scroll", updateThumb);
    window.addEventListener("resize", updateThumb);

    updateThumb();
  })();