import React, { useCallback } from "react";
import Particles from "react-tsparticles";
import { loadSlim } from "tsparticles-slim";
import { Box } from "@mui/material";

const BackgroundAnimation = () => {
    const particlesInit = useCallback(async engine => {
        await loadSlim(engine);
    }, []);

    return (
        <>
        <Box sx={{ 
            position: 'fixed', 
            top: 0, 
            left: 0, 
            width: '100%', 
            height: '100%', 
            zIndex: -2,
            overflow: 'hidden',
            pointerEvents: 'none',
            background: '#050816',
        }}>
            {/* Top-right cyan orb */}
            <Box sx={{
                position: 'absolute',
                top: '-10%',
                right: '-10%',
                width: '600px',
                height: '600px',
                background: 'radial-gradient(circle, rgba(0, 229, 255, 0.15) 0%, rgba(79, 124, 255, 0.05) 50%, transparent 70%)',
                filter: 'blur(80px)',
                borderRadius: '50%',
                opacity: 0.8,
            }} />
            
            {/* Bottom-left blue/purple orb */}
            <Box sx={{
                position: 'absolute',
                bottom: '-15%',
                left: '-10%',
                width: '700px',
                height: '700px',
                background: 'radial-gradient(circle, rgba(79, 124, 255, 0.12) 0%, rgba(124, 58, 237, 0.05) 50%, transparent 70%)',
                filter: 'blur(100px)',
                borderRadius: '50%',
                opacity: 0.7,
            }} />

            {/* Center grid overlay for a subtle futuristic grid effect */}
            <Box sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                backgroundSize: '40px 40px',
                backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
                maskImage: 'radial-gradient(ellipse at center, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 70%)',
                WebkitMaskImage: 'radial-gradient(ellipse at center, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 70%)',
            }} />
        </Box>

        {/* Blockchain Network Particles */}
        <Particles
            id="tsparticles"
            init={particlesInit}
            options={{
                fullScreen: { 
                    enable: true,
                    zIndex: -1
                },
                background: {
                    color: {
                        value: "transparent",
                    },
                },
                fpsLimit: 60,
                particles: {
                    number: {
                        value: 60,
                        density: {
                            enable: true,
                            area: 800,
                        },
                    },
                    color: {
                        value: ["#00E5FF", "#4F7CFF"], // Cyan and Royal Blue
                    },
                    shape: {
                        type: ["circle", "polygon"],
                        options: {
                            polygon: {
                                sides: 6 // Hexagon shape for blockchain tech feel
                            }
                        }
                    },
                    opacity: {
                        value: { min: 0.1, max: 0.5 },
                        animation: {
                            enable: true,
                            speed: 1,
                            sync: false,
                        },
                    },
                    size: {
                        value: { min: 1, max: 3 },
                        animation: {
                            enable: true,
                            speed: 2,
                            sync: false,
                        },
                    },
                    links: {
                        enable: true,
                        distance: 150,
                        color: "#4F7CFF",
                        opacity: 0.2,
                        width: 1,
                        triangles: {
                            enable: true,
                            color: "#00E5FF",
                            opacity: 0.03
                        }
                    },
                    move: {
                        enable: true,
                        speed: 0.6,
                        direction: "none",
                        random: true,
                        straight: false,
                        outModes: {
                            default: "bounce",
                        },
                        attract: {
                            enable: true,
                            rotate: {
                                x: 600,
                                y: 1200
                            }
                        }
                    },
                },
                interactivity: {
                    detectsOn: "canvas",
                    events: {
                        onHover: {
                            enable: true,
                            mode: "grab",
                        },
                        onClick: {
                            enable: true,
                            mode: "push",
                        },
                        resize: true,
                    },
                    modes: {
                        grab: {
                            distance: 180,
                            links: {
                                opacity: 0.5,
                                color: "#00E5FF"
                            },
                        },
                        push: {
                            quantity: 3,
                        },
                    },
                },
                detectRetina: true,
            }}
        />
        </>
    );
};

export default BackgroundAnimation;
