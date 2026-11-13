const videos = [];

const videoGrid = document.querySelector("#video-grid");
const emptyMessage = document.querySelector("#video-empty");

function getYouTubeVideoId(value) {
  let url;

  try {
    url = new URL(value);
  } catch {
    return null;
  }

  if (url.protocol !== "https:") return null;

  const host = url.hostname.toLowerCase();
  const path = url.pathname.split("/").filter(Boolean);
  let videoId = null;

  if (host === "youtu.be") {
    videoId = path[0];
  } else if (["youtube.com", "www.youtube.com", "m.youtube.com"].includes(host)) {
    if (url.pathname === "/watch") {
      videoId = url.searchParams.get("v");
    } else if (["embed", "shorts", "live"].includes(path[0])) {
      videoId = path[1];
    }
  }

  return videoId && /^[A-Za-z0-9_-]{11}$/.test(videoId) ? videoId : null;
}

function createVideoCard(video) {
  const card = document.createElement("article");
  card.className = "video-card";

  const title = document.createElement("h3");
  title.className = "video-title";
  title.textContent = video.title;
  card.append(title);

  const videoId = getYouTubeVideoId(video.url);
  if (!videoId) {
    const error = document.createElement("p");
    error.className = "video-error";
    error.textContent = "Este enlace no es válido. Usa un enlace HTTPS de YouTube.";
    card.append(error);
    return card;
  }

  const frame = document.createElement("iframe");
  frame.className = "video-frame";
  frame.src = `https://www.youtube-nocookie.com/embed/${videoId}?rel=0`;
  frame.title = `Video de YouTube: ${video.title}`;
  frame.loading = "lazy";
  frame.referrerPolicy = "strict-origin-when-cross-origin";
  frame.allow = "encrypted-media; picture-in-picture";
  frame.allowFullscreen = true;
  card.append(frame);
  return card;
}

if (videos.length > 0) {
  emptyMessage.hidden = true;
  videos.forEach((video) => videoGrid.append(createVideoCard(video)));
}
