// Mobile Navigation Toggle
const hamburger = document.querySelector('.hamburger');
const navMenu = document.querySelector('.nav-menu');

if (hamburger && navMenu) {
    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        navMenu.classList.toggle('active');
    });

    // Close mobile menu when clicking on a link
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
        });
    });
}

// Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();

        const targetId = this.getAttribute('href');
        if(targetId === '#') return;

        const targetElement = document.querySelector(targetId);
        if(targetElement) {
            window.scrollTo({
                top: targetElement.offsetTop - 80,
                behavior: 'smooth'
            });
        }
    });
});

// Active link highlighting based on scroll position
let sections = document.querySelectorAll('.section');
let navLinks = document.querySelectorAll('.nav-link');

window.addEventListener('scroll', () => {
    let current = '';

    const scrollPosition = window.scrollY || window.pageYOffset;

    sections.forEach(section => {
        const sectionTop = section.offsetTop;

        if(scrollPosition >= (sectionTop - 200)) {
            current = section.getAttribute('id');
        }
    });

    navLinks.forEach(link => {
        link.classList.remove('active');
        if(link.getAttribute('href').substring(1) === current) {
            link.classList.add('active');
        }
    });
});

// Animation for elements when they come into view
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if(entry.isIntersecting) {
            entry.target.classList.add('visible');
        }
    });
}, observerOptions);

// Observe elements that should animate when scrolled into view
document.addEventListener('DOMContentLoaded', () => {
    const animateElements = document.querySelectorAll('.feature, .category, .stat, .terminal-container');

    animateElements.forEach(el => {
        observer.observe(el);
    });
});

// Terminal typing effect
function typeTerminalEffect(element, text, speed = 50) {
    let i = 0;
    element.innerHTML = '';

    function type() {
        if (i < text.length) {
            element.innerHTML += text.charAt(i);
            i++;
            setTimeout(type, speed);
        }
    }
    type();
}

// Particle animation
function createParticles() {
    const container = document.querySelector('.particles-container');
    if (!container) return;

    const fragment = document.createDocumentFragment();

    for (let i = 0; i < 20; i++) {
        const particle = document.createElement('div');
        particle.classList.add('particle');

        // Random position
        const posX = Math.random() * 100;
        const posY = Math.random() * 100;

        particle.style.left = `${posX}%`;
        particle.style.top = `${posY}%`;

        // Random size
        const size = Math.random() * 3 + 1;
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;

        // Random color
        const colors = ['var(--primary-purple)', 'var(--primary-teal)', 'var(--secondary-blue)'];
        const color = colors[Math.floor(Math.random() * colors.length)];
        particle.style.backgroundColor = color;

        // Random animation
        const duration = Math.random() * 20 + 10;
        const delay = Math.random() * 5;

        particle.style.animation = `float ${duration}s infinite linear ${delay}s`;

        fragment.appendChild(particle);
    }

    container.appendChild(fragment);
}

// Network animation
function animateNetwork() {
    const nodes = document.querySelectorAll('.node');
    const connections = document.querySelectorAll('.connection');

    nodes.forEach((node, index) => {
        setTimeout(() => {
            node.style.animation = `pulse ${Math.random() * 2 + 1}s infinite`;
        }, index * 200);
    });

    connections.forEach((connection, index) => {
        setTimeout(() => {
            connection.style.animation = `connect ${Math.random() * 4 + 2}s infinite`;
        }, index * 400);
    });
}

// Form submission handling (if contact form is added later)
document.addEventListener('DOMContentLoaded', () => {
    const contactForms = document.querySelectorAll('form');

    contactForms.forEach(form => {
        form.addEventListener('submit', (e) => {
            e.preventDefault();

            // Simple form validation and submission feedback
            const formData = new FormData(form);
            const formObject = Object.fromEntries(formData);

            // Check if required fields are filled
            let isValid = true;
            const requiredFields = form.querySelectorAll('[required]');

            requiredFields.forEach(field => {
                if(!field.value.trim()) {
                    isValid = false;
                    field.style.borderColor = '#db142c';
                } else {
                    field.style.borderColor = '';
                }
            });

            if(isValid) {
                // Simulate form submission
                const submitButton = form.querySelector('button[type="submit"]');
                const originalText = submitButton.textContent;

                submitButton.textContent = 'Sending...';
                submitButton.disabled = true;

                setTimeout(() => {
                    // Create a simple notification element
                    const notification = document.createElement('div');
                    notification.className = 'form-notification success';
                    notification.textContent = 'Thank you for your message! We will get back to you soon.';
                    notification.style.cssText = `
                        position: fixed;
                        top: 20px;
                        right: 20px;
                        background-color: #008008;
                        color: white;
                        padding: 15px 20px;
                        border-radius: 5px;
                        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                        z-index: 10000;
                        font-family: var(--font-secondary);
                        max-width: 300px;
                        word-wrap: break-word;
                    `;
                    document.body.appendChild(notification);

                    // Remove notification after 5 seconds
                    setTimeout(() => {
                        if (notification.parentNode) {
                            notification.parentNode.removeChild(notification);
                        }
                    }, 5000);

                    form.reset();
                    submitButton.textContent = originalText;
                    submitButton.disabled = false;
                }, 1500);
            } else {
                // Create an error notification
                const notification = document.createElement('div');
                notification.className = 'form-notification error';
                notification.textContent = 'Please fill in all required fields.';
                notification.style.cssText = `
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background-color: #db142c;
                    color: white;
                    padding: 15px 20px;
                    border-radius: 5px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                    z-index: 10000;
                    font-family: var(--font-secondary);
                    max-width: 300px;
                    word-wrap: break-word;
                `;
                document.body.appendChild(notification);

                // Remove notification after 5 seconds
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.parentNode.removeChild(notification);
                    }
                }, 5000);
            }
        });
    });
});

// The original code that caused tilting has been removed.

// Scroll animations for additional elements
const scrollAnimations = () => {
    const elements = document.querySelectorAll('.section-header h2, .section-header p');

    elements.forEach(el => {
        const elementPosition = el.getBoundingClientRect().top;
        const screenPosition = window.innerHeight / 1.3;

        if(elementPosition < screenPosition) {
            el.style.opacity = '1';
            el.style.transform = 'translateY(0)';
        }
    });
};

// Enhanced terminal effect
function enhanceTerminal() {
    const terminals = document.querySelectorAll('.terminal-container');

    terminals.forEach(terminal => {
        const body = terminal.querySelector('.terminal-body');
        const lines = body.querySelectorAll('.terminal-line');

        lines.forEach((line, index) => {
            setTimeout(() => {
                line.style.opacity = '1';
                line.style.transform = 'translateX(0)';
            }, index * 300);
        });
    });
};

// Add dynamic background effect
function createDynamicBackground() {
    const background = document.createElement('div');
    background.className = 'dynamic-bg';
    background.style.position = 'fixed';
    background.style.top = '0';
    background.style.left = '0';
    background.style.width = '100%';
    background.style.height = '100%';
    background.style.zIndex = '-2';
    background.style.background = 'radial-gradient(circle at center, rgba(139, 61, 255, 0.05) 0%, transparent 70%)';
    background.style.pointerEvents = 'none';
    background.style.opacity = '0';

    document.body.appendChild(background);

    // Animate the background using requestAnimationFrame for better performance
    let opacity = 0.05;
    let direction = 1;
    let lastTime = 0;
    const animationSpeed = 100; // milliseconds between updates

    function animate(currentTime) {
        if (currentTime - lastTime >= animationSpeed) {
            opacity += 0.005 * direction;

            if (opacity > 0.1) {
                direction = -1;
                opacity = 0.1;
            } else if (opacity < 0.03) {
                direction = 1;
                opacity = 0.03;
            }

            background.style.opacity = opacity;
            lastTime = currentTime;
        }

        requestAnimationFrame(animate);
    }

    requestAnimationFrame(animate);
}

// Single DOMContentLoaded listener for all initialization
document.addEventListener('DOMContentLoaded', () => {
    // Initialize terminal effects
    const terminalLines = document.querySelectorAll('.terminal-line:not(.static)');

    terminalLines.forEach((line, index) => {
        const text = line.textContent;
        line.textContent = '';

        setTimeout(() => {
            typeTerminalEffect(line, text, 30);
        }, index * 500);
    });

    // Initialize animations
    createParticles();
    animateNetwork();

    // Glitch effect enhancement
    const glitchElements = document.querySelectorAll('.glitch');
    glitchElements.forEach(el => {
        // Clear any existing interval to prevent memory leaks
        if (el.glitchInterval) {
            clearInterval(el.glitchInterval);
        }

        el.glitchInterval = setInterval(() => {
            el.style.animation = 'none';
            setTimeout(() => {
                el.style.animation = 'glitch-anim 5s infinite';
            }, 10);
        }, 10000); // Random glitch every 10 seconds
    });

    // Set initial styles for scroll animations
    const elements = document.querySelectorAll('.section-header h2, .section-header p');

    elements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    });

    window.addEventListener('scroll', scrollAnimations);
    scrollAnimations(); // Initial check

    // Enhanced terminal effect
    enhanceTerminal();

    // Add dynamic background effect
    createDynamicBackground();
});