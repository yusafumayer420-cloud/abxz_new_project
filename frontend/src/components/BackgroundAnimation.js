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
            background: '#0A0E17',
        }}>
            {/* Blurred Chart Overlay */}
            <Box sx={{
                position: 'absolute',
                top: '5%',
                right: '-10%',
                width: '600px',
                height: '600px',
                background: 'linear-gradient(135deg, rgba(0, 211, 149, 0.2) 0%, rgba(67, 97, 238, 0.2) 100%)',
                filter: 'blur(100px)',
                borderRadius: '50%',
                transform: 'rotate(-15deg)',
                opacity: 0.9,
            }} />
            
            <Box sx={{
                position: 'absolute',
                bottom: '-10%',
                left: '-15%',
                width: '700px',
                height: '700px',
                background: 'linear-gradient(135deg, rgba(114, 9, 183, 0.2) 0%, rgba(255, 107, 107, 0.2) 100%)',
                filter: 'blur(120px)',
                borderRadius: '50%',
                transform: 'rotate(20deg)',
                opacity: 0.8,
            }} />
        </Box>

        {/* tsParticles */}
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
                fpsLimit: 120,
                particles: {
                    color: {
                        value: "#ffffff",
                    },
                    links: {
                        color: "#ffffff",
                        distance: 150,
                        enable: true,
                        opacity: 0.3,
                        width: 1,
                    },
                    move: {
                        direction: "none",
                        enable: true,
                        outModes: {
                            default: "out",
                        },
                        random: true,
                        speed: 1,
                        straight: false,
                    },
                    number: {
                        density: {
                            enable: true,
                            area: 800,
                        },
                        value: 80,
                    },
                    opacity: {
                        value: 0.4,
                    },
                    shape: {
                        type: "circle",
                    },
                    size: {
                        value: { min: 1, max: 4 },
                    },
                },
                detectRetina: true,
            }}
        />
        </>
    );
};

export default BackgroundAnimation;
