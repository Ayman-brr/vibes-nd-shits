document.addEventListener('DOMContentLoaded', () => {
    // DOM elements
    const videoFileInput = document.getElementById('video-file');
    const videoNameSpan = document.getElementById('video-name');
    const videoPreview = document.getElementById('video-preview');
    const textContent = document.getElementById('text-content');
    const textBox = document.getElementById('text-box');
    const textSegmentsInput = document.getElementById('text-segments');
    const segmentCountSpan = document.getElementById('segment-count');
    const segmentDropdown = document.getElementById('segment-dropdown');
    const fontSizeInput = document.getElementById('font-size');
    const fontSizeValue = document.getElementById('font-size-value');
    const rotationInput = document.getElementById('rotation');
    const alignButtons = document.querySelectorAll('.align-btn');
    const exportButton = document.getElementById('export-btn');
    const progressBar = document.getElementById('progress-bar');
    const progressText = document.getElementById('progress-text');

    // State variables
    let currentVideoFile = null;
    let videoAspectRatio = 16 / 9;
    let currentSegmentIndex = 0;
    let segments = ["First segment text", "Second segment text"];
    let textStyles = {
        fontSize: 36,
        rotation: 0,
        alignment: 'left',
        position: { x: 50, y: 50 }, // percentage values
        size: { width: 30, height: 20 } // percentage values
    };

    // Initialize UI
    updateSegmentUI();

    // Event listeners
    videoFileInput.addEventListener('change', handleVideoUpload);
    textSegmentsInput.addEventListener('input', handleSegmentsChange);
    segmentDropdown.addEventListener('change', handleSegmentChange);
    fontSizeInput.addEventListener('input', handleFontSizeChange);
    rotationInput.addEventListener('input', handleRotationChange);
    alignButtons.forEach(btn => {
        btn.addEventListener('click', () => handleAlignmentChange(btn.dataset.align));
    });
    exportButton.addEventListener('click', handleExport);
    
    // Initialize draggable and resizable text box
    initTextOverlay();

    // Functions
    function handleVideoUpload(e) {
        const file = e.target.files[0];
        if (!file || !file.type.includes('video')) return;
        
        currentVideoFile = file;
        videoNameSpan.textContent = file.name;
        
        const videoURL = URL.createObjectURL(file);
        videoPreview.src = videoURL;
        
        videoPreview.onloadedmetadata = () => {
            videoAspectRatio = videoPreview.videoWidth / videoPreview.videoHeight;
            videoPreview.style.aspectRatio = videoAspectRatio;
        };
    }

    function handleSegmentsChange() {
        segments = textSegmentsInput.value.split('\n\n').filter(segment => segment.trim() !== '');
        if (segments.length === 0) segments = [""];
        updateSegmentUI();
        updateTextContent();
    }

    function updateSegmentUI() {
        segmentCountSpan.textContent = segments.length;
        
        // Update dropdown
        segmentDropdown.innerHTML = '';
        segments.forEach((_, i) => {
            const option = document.createElement('option');
            option.value = i;
            option.textContent = `Segment ${i + 1}`;
            if (i === currentSegmentIndex) option.selected = true;
            segmentDropdown.appendChild(option);
        });
    }

    function handleSegmentChange() {
        currentSegmentIndex = parseInt(segmentDropdown.value);
        updateTextContent();
    }

    function updateTextContent() {
        textContent.textContent = segments[currentSegmentIndex] || "Edit your text here";
    }

    function handleFontSizeChange() {
        const size = parseInt(fontSizeInput.value);
        textStyles.fontSize = size;
        fontSizeValue.textContent = size;
        textContent.style.fontSize = `${size}px`;
    }

    function handleRotationChange() {
        const rotation = parseInt(rotationInput.value);
        textStyles.rotation = rotation;
        textBox.style.transform = `translate(-50%, -50%) rotate(${rotation}deg)`;
    }

    function handleAlignmentChange(alignment) {
        textStyles.alignment = alignment;
        textContent.style.textAlign = alignment;
        
        // Update active button
        alignButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.align === alignment);
        });
    }

    function initTextOverlay() {
        // Make text box draggable
        let isDragging = false;
        let offsetX, offsetY;
        
        textBox.addEventListener('mousedown', startDrag);
        document.addEventListener('mousemove', drag);
        document.addEventListener('mouseup', stopDrag);
        
        function startDrag(e) {
            if (e.target === textBox) {
                isDragging = true;
                const rect = textBox.getBoundingClientRect();
                offsetX = e.clientX - rect.left;
                offsetY = e.clientY - rect.top;
                textBox.style.cursor = 'grabbing';
            }
        }
        
        function drag(e) {
            if (!isDragging) return;
            
            const container = textBox.parentElement;
            const containerRect = container.getBoundingClientRect();
            
            let x = e.clientX - containerRect.left - offsetX;
            let y = e.clientY - containerRect.top - offsetY;
            
            // Constrain within container
            x = Math.max(0, Math.min(x, containerRect.width - textBox.offsetWidth));
            y = Math.max(0, Math.min(y, containerRect.height - textBox.offsetHeight));
            
            // Convert to percentage
            textStyles.position.x = (x / containerRect.width) * 100;
            textStyles.position.y = (y / containerRect.height) * 100;
            
            textBox.style.left = `${x}px`;
            textBox.style.top = `${y}px`;
        }
        
        function stopDrag() {
            isDragging = false;
            textBox.style.cursor = 'grab';
        }
        
        // Make text box resizable
        textBox.addEventListener('mousedown', function(e) {
            if (e.offsetX > textBox.offsetWidth - 20 && e.offsetY > textBox.offsetHeight - 20) {
                e.preventDefault();
                document.addEventListener('mousemove', resize);
                document.addEventListener('mouseup', stopResize);
            }
        });
        
        function resize(e) {
            const container = textBox.parentElement;
            const containerRect = container.getBoundingClientRect();
            
            const width = Math.max(150, e.clientX - textBox.getBoundingClientRect().left);
            const height = Math.max(50, e.clientY - textBox.getBoundingClientRect().top);
            
            // Constrain within container
            const maxWidth = containerRect.width - textBox.offsetLeft;
            const maxHeight = containerRect.height - textBox.offsetTop;
            
            textBox.style.width = `${Math.min(width, maxWidth)}px`;
            textBox.style.height = `${Math.min(height, maxHeight)}px`;
            
            // Convert to percentage
            textStyles.size.width = (textBox.offsetWidth / containerRect.width) * 100;
            textStyles.size.height = (textBox.offsetHeight / containerRect.height) * 100;
        }
        
        function stopResize() {
            document.removeEventListener('mousemove', resize);
            document.removeEventListener('mouseup', stopResize);
        }
    }

    async function handleExport() {
        if (!currentVideoFile) {
            alert('Please upload a video first');
            return;
        }
        
        if (segments.length === 0) {
            alert('Please add at least one text segment');
            return;
        }
        
        exportButton.disabled = true;
        progressText.textContent = 'Preparing export...';
        progressBar.style.width = '0%';
        
        try {
            // Initialize FFmpeg
            progressText.textContent = 'Loading FFmpeg...';
            const { createFFmpeg, fetchFile } = FFmpeg;
            const ffmpeg = createFFmpeg({ log: true });
            await ffmpeg.load();
            
            // Write video file to FFmpeg FS
            const videoData = await fetchFile(currentVideoFile);
            ffmpeg.FS('writeFile', 'input.mp4', videoData);
            
            // Process each segment
            for (let i = 0; i < segments.length; i++) {
                const segment = segments[i];
                progressText.textContent = `Processing segment ${i + 1}/${segments.length}...`;
                progressBar.style.width = `${(i / segments.length) * 100}%`;
                
                // Generate text overlay image
                const textImage = await generateTextImage(segment);
                ffmpeg.FS('writeFile', 'text.png', textImage);
                
                // Build FFmpeg command
                const rotation = textStyles.rotation;
                const fontSize = Math.max(8, Math.min(200, textStyles.fontSize));
                const alignment = textStyles.alignment;
                const xPos = textStyles.position.x;
                const yPos = textStyles.position.y;
                
                // Execute FFmpeg command
                await ffmpeg.run(
                    '-i', 'input.mp4',
                    '-i', 'text.png',
                    '-filter_complex', 
                    `[0:v][1:v]overlay=x=(W-w)*${xPos/100}:y=(H-h)*${yPos/100}:enable='between(t,0,10)'`,
                    `output_${i + 1}.mp4`
                );
                
                // Read output file
                const data = ffmpeg.FS('readFile', `output_${i + 1}.mp4`);
                
                // Create download link
                const url = URL.createObjectURL(new Blob([data.buffer], { type: 'video/mp4' }));
                const a = document.createElement('a');
                a.href = url;
                a.download = `video_segment_${i + 1}.mp4`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                
                // Clean up
                URL.revokeObjectURL(url);
                ffmpeg.FS('unlink', `output_${i + 1}.mp4`);
            }
            
            progressText.textContent = 'Export completed!';
            progressBar.style.width = '100%';
        } catch (error) {
            console.error('Export error:', error);
            progressText.textContent = `Error: ${error.message}`;
            progressBar.style.backgroundColor = 'var(--error)';
        } finally {
            exportButton.disabled = false;
        }
    }
});

// Helper function to generate text image (simplified for example)
async function generateTextImage(text) {
    // In a real implementation, this would use canvas to generate a transparent PNG
    // with the styled text. For this example, we'll return a blank image.
    return new Uint8Array();
}
