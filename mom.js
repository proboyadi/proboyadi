// Audio Setup
const music = new Audio('happy-birthday-334876.mp3');
music.loop = true;

let mediaRecorder;
let audioChunks = [];
let audioUrl = null;           // from live recording
let uploadedAudioUrl = null;   // from file upload

// 1. Unlock & Initialize
document.getElementById('open-btn').addEventListener('click', function() {
    document.body.classList.add('unlocked');
    document.getElementById('envelope-modal').classList.add('hidden');
    document.getElementById('navbar').style.top = "0";
    
    music.play();
    startParticles();
    initScratchCard(); // Refreshed initialization
    initReveal();
    displayStoredWishes();
});

// 2. Scratch Card Logic (Fixed for Reloads)
function initScratchCard() {
    const canvas = document.getElementById('scratch-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    // Reset canvas state for fresh reload
    ctx.globalCompositeOperation = 'source-over';
    
    // Fill with Gold Cover
    ctx.fillStyle = '#d4af37';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add text on top of gold
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 18px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('SCRATCH HERE! ✨', canvas.width/2, canvas.height/2 + 5);

    let isDrawing = false;

    const scratch = (e) => {
        if (!isDrawing) return;
        const rect = canvas.getBoundingClientRect();
        // Handle both Mouse and Touch
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        
        const x = clientX - rect.left;
        const y = clientY - rect.top;

        ctx.globalCompositeOperation = 'destination-out';
        ctx.beginPath();
        ctx.arc(x, y, 25, 0, Math.PI * 2);
        ctx.fill();
    };

    canvas.addEventListener('mousedown', () => isDrawing = true);
    canvas.addEventListener('touchstart', (e) => { isDrawing = true; e.preventDefault(); });
    window.addEventListener('mouseup', () => isDrawing = false);
    window.addEventListener('touchend', () => isDrawing = false);
    canvas.addEventListener('mousemove', scratch);
    canvas.addEventListener('touchmove', (e) => { scratch(e); e.preventDefault(); });
}

// 3. Wish Type Switching (now with 3 options)
document.addEventListener('DOMContentLoaded', function() {
    const textRadio   = document.getElementById('wish-type-text');
    const voiceRadio  = document.getElementById('wish-type-voice');
    const uploadRadio = document.getElementById('wish-type-upload');

    const textArea    = document.getElementById('text-wish-area');
    const voiceArea   = document.getElementById('voice-rec-area');
    const uploadArea  = document.getElementById('voice-upload-area');

    function updateWishType() {
        textArea.classList.add('hidden');
        voiceArea.classList.add('hidden');
        uploadArea.classList.add('hidden');

        if (textRadio.checked) {
            textArea.classList.remove('hidden');
        } else if (voiceRadio.checked) {
            voiceArea.classList.remove('hidden');
        } else if (uploadRadio.checked) {
            uploadArea.classList.remove('hidden');
        }
    }

    textRadio.addEventListener('change', updateWishType);
    voiceRadio.addEventListener('change', updateWishType);
    uploadRadio.addEventListener('change', updateWishType);

    updateWishType();
});

// Recording Logic (live microphone)  ── FIXED MIME TYPE ──
document.getElementById('record-btn').addEventListener('click', async function() {
    if (!mediaRecorder || mediaRecorder.state === "inactive") {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder = new MediaRecorder(stream);
            audioChunks = [];
            
            mediaRecorder.ondataavailable = e => audioChunks.push(e.data);
            mediaRecorder.onstop = () => {
                // ─────────────── IMPORTANT CHANGE HERE ───────────────
                const realMimeType = mediaRecorder.mimeType || 'audio/webm;codecs=opus';
                const audioBlob = new Blob(audioChunks, { type: realMimeType });
                // ──────────────────────────────────────────────────────

                const reader = new FileReader();
                reader.readAsDataURL(audioBlob); 
                reader.onloadend = () => {
                    audioUrl = reader.result;
                    document.getElementById('rec-status').innerText = "✅ Voice Note Ready!";
                };
            };
            mediaRecorder.start();
            this.innerText = "🛑 Stop Recording";
            document.getElementById('rec-status').innerText = "Recording...";
        } catch (err) {
            alert("Microphone access denied or not available.");
        }
    } else {
        mediaRecorder.stop();
        this.innerText = "🎤 Start Recording";
    }
});

// Handle audio file upload  ── FIXED: keep real file type ──
document.getElementById('audio-upload').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('audio/')) {
        alert("Please select an audio file (mp3, wav, m4a, ogg, etc.)");
        this.value = '';
        return;
    }

    if (file.size > 5 * 1024 * 1024) {   // 5 MB limit
        alert("File is too large (maximum 5 MB allowed)");
        this.value = '';
        return;
    }

    const reader = new FileReader();
    reader.onload = function(ev) {
        uploadedAudioUrl = ev.target.result;  // keeps correct mime type like audio/mpeg, audio/mp4 etc.
        document.getElementById('upload-status').innerText = 
            `Selected: ${file.name}  (${(file.size / 1024).toFixed(1)} KB)`;
    };
    reader.readAsDataURL(file);
});

// Send wish (updated to handle all 3 types)
document.getElementById('send-wish-btn').addEventListener('click', () => {
    const name = document.getElementById('sender-name')?.value.trim() || "Anonymous";
    
    const isText   = document.getElementById('wish-type-text').checked;
    const isRecord = document.getElementById('wish-type-voice').checked;
    const isUpload = document.getElementById('wish-type-upload').checked;

    const text = isText ? (document.getElementById('text-msg')?.value.trim() || "") : "";

    if (isText   && !text)               return alert("Please write your wish!");
    if (isRecord && !audioUrl)           return alert("Please record your audio wish!");
    if (isUpload && !uploadedAudioUrl)   return alert("Please upload an audio file!");

    const newWish = {
        name: name,
        text: isText ? text : null,
        audio: isRecord ? audioUrl : (isUpload ? uploadedAudioUrl : null),
        id: Date.now()
    };

    let wishes = JSON.parse(localStorage.getItem('mummyWishes')) || [];
    wishes.push(newWish);
    localStorage.setItem('mummyWishes', JSON.stringify(wishes));

    // Reset form
    if (document.getElementById('text-msg')) document.getElementById('text-msg').value = "";
    if (document.getElementById('sender-name')) document.getElementById('sender-name').value = "";
    if (document.getElementById('audio-upload')) document.getElementById('audio-upload').value = "";
    if (document.getElementById('upload-status')) document.getElementById('upload-status').innerText = "No file selected";
    audioUrl = null;
    uploadedAudioUrl = null;
    if (document.getElementById('rec-status')) document.getElementById('rec-status').innerText = "Ready to record...";

    displayStoredWishes();
});

function displayStoredWishes() {
    const container = document.getElementById('wishes-display-grid');
    const wishes = JSON.parse(localStorage.getItem('mummyWishes')) || [];
    container.innerHTML = "";

    wishes.forEach(wish => {
        const card = document.createElement('div');
        card.className = 'wish-note';
        card.innerHTML = `
            <div class="tape"></div>
            <h4>From: ${wish.name || 'Anonymous'}</h4>
            ${wish.audio ? `<audio src="${wish.audio}" controls style="width:100%"></audio>` : ''}
            ${wish.text ? `<p>"${wish.text}"</p>` : ''}
            <button onclick="deleteWish(${wish.id})" class="delete-btn">×</button>
        `;
        container.appendChild(card);
    });
}

function deleteWish(id) {
    let wishes = JSON.parse(localStorage.getItem('mummyWishes')) || [];
    wishes = wishes.filter(w => w.id !== id);
    localStorage.setItem('mummyWishes', JSON.stringify(wishes));
    displayStoredWishes();
}

// Helper Animations (unchanged)
function startParticles() { 
    // your existing particles code remains here 
}

function initReveal() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => { if (entry.isIntersecting) entry.target.classList.add('active'); });
    }, { threshold: 0.1 });
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
}
