import React, { useRef, useEffect } from 'react';

const Starfield: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let width = window.innerWidth;
        let height = window.innerHeight;
        let animationFrameId: number;
        
        const setup = () => {
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
        };

        const STAR_LAYERS = [
            // Increased radius by 40%
            { count: 40, minRadius: 2.1, maxRadius: 3.5, speed: 0.8, twinkle: true }, // Foreground
            { count: 100, minRadius: 1.1, maxRadius: 2.1, speed: 0.5, twinkle: false }, // Midground
            { count: 400, minRadius: 0.4, maxRadius: 1.1, speed: 0.2, twinkle: false }, // Background
        ];

        const NEBULAE = [
            { x: 0.2, y: 0.3, radius: 0.4, color: 'rgba(75, 0, 130, 0.15)' }, // Indigo
            { x: 0.8, y: 0.7, radius: 0.5, color: 'rgba(0, 75, 130, 0.12)' }, // Teal
            { x: 0.5, y: 0.8, radius: 0.3, color: 'rgba(130, 0, 75, 0.15)' }, // Purple
        ];

        let stars: any[] = [];
        let comets: any[] = [];
        let rotation = 0;
        // Full rotation over ~240 seconds (4 minutes)
        const ROTATION_SPEED = (Math.PI * 2) / (240 * 60); 

        const createStars = () => {
            stars = [];
            const maxDist = Math.sqrt(width*width + height*height);
            STAR_LAYERS.forEach(layer => {
                for (let i = 0; i < layer.count; i++) {
                    stars.push({
                        dist: (Math.random() ** 2) * maxDist / 2,
                        angle: Math.random() * Math.PI * 2,
                        radius: Math.random() * (layer.maxRadius - layer.minRadius) + layer.minRadius,
                        // Increased opacity for brighter stars
                        alpha: Math.random() * 0.5 + 0.4, 
                        twinkle: layer.twinkle,
                        twinkleSpeed: Math.random() * 0.02,
                        twinklePhase: Math.random() * Math.PI * 2,
                        speedMultiplier: layer.speed,
                    });
                }
            });
        };

        const createComets = () => {
            // Keep a max of 1 comet on screen, and spawn it occasionally
            if (comets.length < 1 && Math.random() > 0.97) {
                 const edge = Math.floor(Math.random() * 4);
                let x, y, angle;

                switch (edge) {
                    case 0: // Top
                        x = Math.random() * width;
                        y = -10;
                        angle = Math.random() * Math.PI;
                        break;
                    case 1: // Right
                        x = width + 10;
                        y = Math.random() * height;
                        angle = Math.random() * Math.PI + Math.PI / 2;
                        break;
                    case 2: // Bottom
                        x = Math.random() * width;
                        y = height + 10;
                        angle = Math.random() * Math.PI + Math.PI;
                        break;
                    case 3: // Left
                        x = -10;
                        y = Math.random() * height;
                        angle = Math.random() * Math.PI - Math.PI / 2;
                        break;
                    default: x = 0; y = 0; angle = 0;
                }

                comets.push({
                    x,
                    y,
                    radius: Math.random() * 1.5 + 0.5,
                    speed: Math.random() * 1.5 + 0.5, // Increased speed
                    angle,
                    length: Math.random() * 80 + 40,
                    alpha: 1,
                });
            }
        };

        const draw = () => {
            if (!ctx) return;
            ctx.clearRect(0, 0, width, height);

            rotation -= ROTATION_SPEED; // Changed from += to -= for counter-clockwise rotation
            
            // Draw Nebulae
            NEBULAE.forEach(nebula => {
                const centerX = nebula.x * width;
                const centerY = nebula.y * height;
                const radius = nebula.radius * Math.min(width, height);
                const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
                gradient.addColorStop(0, nebula.color);
                gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
                ctx.fillStyle = gradient;
                ctx.fillRect(0, 0, width, height);
            });

            // Draw Stars
            const centerX = width / 2;
            const centerY = height / 2;
            stars.forEach(star => {
                const currentAngle = star.angle + rotation * star.speedMultiplier;
                const x = centerX + Math.cos(currentAngle) * star.dist;
                const y = centerY + Math.sin(currentAngle) * star.dist;

                let alpha = star.alpha;
                if (star.twinkle) {
                    alpha *= (Math.sin(star.twinklePhase + Date.now() * 0.001 * star.twinkleSpeed) * 0.4 + 0.6);
                }

                if (x > 0 && x < width && y > 0 && y < height) {
                    ctx.fillStyle = `rgba(222, 226, 230, ${alpha})`;
                    ctx.beginPath();
                    ctx.arc(x, y, star.radius, 0, Math.PI * 2);
                    ctx.fill();
                }
            });

            // Draw and update comets
            createComets();
            comets.forEach((comet, index) => {
                const tailX = comet.x - comet.length * Math.cos(comet.angle);
                const tailY = comet.y - comet.length * Math.sin(comet.angle);

                const gradient = ctx.createLinearGradient(comet.x, comet.y, tailX, tailY);
                // Changed comet color to app's primary theme color: #29ffb8 (41, 255, 184)
                gradient.addColorStop(0, `rgba(41, 255, 184, ${comet.alpha})`);
                gradient.addColorStop(1, 'rgba(41, 255, 184, 0)');

                ctx.strokeStyle = gradient;
                ctx.lineWidth = comet.radius;
                ctx.beginPath();
                ctx.moveTo(comet.x, comet.y);
                ctx.lineTo(tailX, tailY);
                ctx.stroke();

                comet.x += Math.cos(comet.angle) * comet.speed;
                comet.y += Math.sin(comet.angle) * comet.speed;
                comet.alpha -= 0.0025;

                if (comet.alpha <= 0) {
                    comets.splice(index, 1);
                }
            });

            animationFrameId = requestAnimationFrame(draw);
        };

        const handleResize = () => {
            setup();
            createStars();
        };
        
        setup();
        createStars();
        draw();
        
        window.addEventListener('resize', handleResize);

        return () => {
            cancelAnimationFrame(animationFrameId);
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    return <canvas ref={canvasRef} id="starfield-canvas" />;
};

export default Starfield;
