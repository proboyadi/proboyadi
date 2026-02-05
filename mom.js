// Audio Setup
const music = new Audio('happy-birthday-334876.mp3');
music.loop = true;

let mediaRecorder;
let audioChunks = [];
let audioUrl = null;

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

// 3. Wishes Persistence Logic

function switchInput(type) {
    document.getElementById('text-msg').classList.toggle('hidden', type !== 'text');
    document.getElementById('voice-rec-area').classList.toggle('hidden', type !== 'voice');
    document.getElementById('btn-text').classList.toggle('active', type === 'text');
    document.getElementById('btn-voice').classList.toggle('active', type === 'voice');
}

// Recording Logic with Base64 fix
document.getElementById('record-btn').addEventListener('click', async function() {
    if (!mediaRecorder || mediaRecorder.state === "inactive") {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        audioChunks = [];
        
        mediaRecorder.ondataavailable = e => audioChunks.push(e.data);
        mediaRecorder.onstop = () => {
            const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
            const reader = new FileReader();
            reader.readAsDataURL(audioBlob); 
            reader.onloadend = () => {
                audioUrl = reader.result; // This Base64 string survives reload
                document.getElementById('rec-status').innerText = "✅ Voice Note Ready!";
            };
        };
        mediaRecorder.start();
        this.innerText = "🛑 Stop Recording";
        document.getElementById('rec-status').innerText = "Recording...";
    } else {
        mediaRecorder.stop();
        this.innerText = "🎤 Start Recording";
    }
});

document.getElementById('send-wish-btn').addEventListener('click', () => {
    if (!audioUrl) return alert("Please record your audio wish first!");

    const newWish = {
        audio: audioUrl,
        id: Date.now()
    };

    let wishes = JSON.parse(localStorage.getItem('mummyWishes')) || [];
    wishes.push(newWish);
    localStorage.setItem('mummyWishes', JSON.stringify(wishes));

    displayStoredWishes();
    audioUrl = null;
    document.getElementById('rec-status').innerText = "Ready to record...";
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
            <h4>From: ${wish.name}</h4>
            ${wish.audio ? `<audio src="${wish.audio}" controls style="width:100%"></audio>` : `<p>"${wish.text}"</p>`}
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

// Helper Animations
function startParticles() { /* ... keep your existing startParticles code ... */ }
function initReveal() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => { if (entry.isIntersecting) entry.target.classList.add('active'); });
    }, { threshold: 0.1 });
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
}
