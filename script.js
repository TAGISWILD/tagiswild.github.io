// Set current year
document.getElementById('year').textContent = new Date().getFullYear();

// Enhanced smooth scrolling function with custom easing
function smoothScrollTo(targetPosition, duration = 800) {
  const startPosition = window.pageYOffset;
  const distance = targetPosition - startPosition;
  let startTime = null;
  
  // Easing function for smooth animation
  function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }
  
  function animation(currentTime) {
    if (startTime === null) startTime = currentTime;
    const timeElapsed = currentTime - startTime;
    const progress = Math.min(timeElapsed / duration, 1);
    
    const ease = easeInOutCubic(progress);
    window.scrollTo(0, startPosition + distance * ease);
    
    if (timeElapsed < duration) {
      requestAnimationFrame(animation);
    }
  }
  
  requestAnimationFrame(animation);
}

// Global smooth scrolling for all internal links
function initializeSmoothScrolling() {
  // Handle all internal anchor links
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      if (href === '#' || href === '') return;
      
      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        
        // Calculate offset for mobile navigation
        let offset = 0;
        if (window.innerWidth < 1024) {
          const mobileNav = document.querySelector('.mobile-nav');
          if (mobileNav) {
            offset = mobileNav.offsetHeight + 10; // 10px buffer
          }
        }
        
        const targetPosition = target.offsetTop - offset;
        smoothScrollTo(targetPosition, 1000);
        
        // Update URL without jumping
        if (history.pushState) {
          history.pushState(null, null, href);
        }
        
        triggerHaptic('navigation');
      }
    });
  });
  
  // Handle back/forward browser navigation
  window.addEventListener('popstate', (e) => {
    const hash = window.location.hash;
    if (hash) {
      const target = document.querySelector(hash);
      if (target) {
        let offset = 0;
        if (window.innerWidth < 1024) {
          const mobileNav = document.querySelector('.mobile-nav');
          if (mobileNav) {
            offset = mobileNav.offsetHeight + 10;
          }
        }
        
        const targetPosition = target.offsetTop - offset;
        smoothScrollTo(targetPosition, 600);
      }
    }
  });
}

// Enhanced haptic feedback helper
function triggerHaptic(type = 'light') {
  if ('vibrate' in navigator) {
    // Different vibration patterns for different feedback types
    const patterns = {
      light: 5,           // Quick tap
      medium: 15,         // Button press
      heavy: 25,          // Important action
      double: [10, 50, 10], // Double tap
      success: [10, 30, 10, 30, 10], // Success feedback
      error: [50, 50, 50], // Error feedback
      scroll: 3,          // Very light scroll feedback
      hover: 2,           // Subtle hover feedback
      navigation: [5, 10, 5], // Navigation feedback
      card: 8,            // Card interaction
      typing: 1           // Very light typing feedback
    };
    navigator.vibrate(patterns[type] || patterns.light);
  }
  
  // iOS haptic feedback enhancement
  if (window.DeviceMotionEvent && typeof DeviceMotionEvent.requestPermission === 'function') {
    if (navigator.vibrate) {
      const iosPatterns = {
        light: 5,
        medium: 15,
        heavy: 30,
        scroll: 2,
        hover: 1
      };
      navigator.vibrate(iosPatterns[type] || iosPatterns.light);
    }
  }
}

// Comprehensive haptic feedback system
function addUniversalHapticFeedback() {
  // 1. All clickable elements
  document.addEventListener('click', (e) => {
    const target = e.target.closest('a, button, [role="button"], .card, [data-target]');
    if (target) {
      if (target.matches('[data-target]')) {
        triggerHaptic('navigation');
      } else if (target.matches('.card')) {
        triggerHaptic('card');
      } else if (target.matches('a[href^="mailto:"]')) {
        triggerHaptic('success');
		} else {
        triggerHaptic('medium');
      }
    }
  }, { passive: true });

  // 2. Touch start feedback (immediate response)
  document.addEventListener('touchstart', (e) => {
    const target = e.target.closest('a, button, [role="button"], .card, [data-target], input, textarea');
    if (target) {
      triggerHaptic('light');
    }
  }, { passive: true });

  // 3. Hover feedback (for devices that support it)
  document.addEventListener('mouseenter', (e) => {
    if ('ontouchstart' in window) return; // Skip on touch devices
    const target = e.target.closest('a, button, [role="button"], .card, [data-target]');
    if (target) {
      triggerHaptic('hover');
    }
  }, true);

  // 4. Focus feedback
  document.addEventListener('focusin', (e) => {
    if (e.target.matches('a, button, [role="button"], input, textarea')) {
      triggerHaptic('light');
    }
  }, { passive: true });

  // 5. Form interactions
  document.addEventListener('input', (e) => {
    if (e.target.matches('input, textarea')) {
      triggerHaptic('typing');
    }
  }, { passive: true });

  // 6. Scroll feedback removed for better UX

  // 7. Section transition feedback
  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
        triggerHaptic('navigation');
      }
    });
  }, { threshold: 0.5 });

  // Observe all sections
  document.querySelectorAll('section, header, footer').forEach(section => {
    sectionObserver.observe(section);
  });

  // 8. Image load feedback
  document.querySelectorAll('img').forEach(img => {
    img.addEventListener('load', () => {
      triggerHaptic('light');
    }, { once: true });
  });

  // 9. Long press feedback
  let longPressTimeout;
  document.addEventListener('touchstart', (e) => {
    const target = e.target.closest('a, button, [role="button"], .card');
    if (target) {
      longPressTimeout = setTimeout(() => {
        triggerHaptic('heavy');
		}, 500);
    }
  }, { passive: true });

  document.addEventListener('touchend', () => {
    clearTimeout(longPressTimeout);
  }, { passive: true });

  // 10. Double tap feedback
  let lastTap = 0;
  document.addEventListener('touchend', (e) => {
    const currentTime = new Date().getTime();
    const tapLength = currentTime - lastTap;
    if (tapLength < 500 && tapLength > 0) {
      triggerHaptic('double');
    }
    lastTap = currentTime;
  }, { passive: true });

  // 11. Page visibility feedback
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      triggerHaptic('light');
    }
  });

  // 12. Error/Success feedback for forms
  document.addEventListener('submit', (e) => {
    triggerHaptic('success');
  });

  document.addEventListener('invalid', (e) => {
    triggerHaptic('error');
  });

  // 13. Menu/dropdown interactions
  document.addEventListener('toggle', (e) => {
    triggerHaptic('medium');
  });

  // 14. Drag interactions (if any)
  document.addEventListener('dragstart', () => triggerHaptic('medium'));
  document.addEventListener('dragend', () => triggerHaptic('light'));

  // 15. Selection feedback
  document.addEventListener('selectstart', () => triggerHaptic('light'));
}

// Load and render projects
async function loadProjects() {
  try {
    const response = await fetch('./projects.json');
    const data = await response.json();
    renderProjects(data);
  } catch (error) {
    console.error('Failed to load projects:', error);
    // Fallback content
    const container = document.getElementById('projects-container');
    if (container) {
      container.innerHTML = `
        <div class="text-center py-12">
          <p class="text-slate-600">Projects are loading... Please check back soon!</p>
        </div>
      `;
    }
  }
}

function renderProjects(data) {
  const container = document.getElementById('projects-container');
  if (!container) return;

  let html = '';

  // Featured Projects
  if (data.featured && data.featured.length > 0) {
    html += `
      <div class="mb-20">
        <h3 class="text-2xl font-bold text-slate-800 mb-8 flex items-center">
          <span class="mr-3">•</span> Featured Projects
        </h3>
        <div class="grid lg:grid-cols-2 gap-8">
    `;
    
    data.featured.forEach(project => {
      html += createFeaturedProjectCard(project);
    });
    
    html += `</div></div>`;
  }

  // Regular Projects
  if (data.projects && data.projects.length > 0) {
    html += `
      <div class="mb-20">
        <h3 class="text-2xl font-bold text-slate-800 mb-8 flex items-center">
          <span class="mr-3">🔨</span> Other Projects
        </h3>
        <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
    `;
    
    data.projects.forEach(project => {
      html += createRegularProjectCard(project);
    });
    
    html += `</div></div>`;
  }

  // Companies/Ventures
  if (data.companies && data.companies.length > 0) {
    html += `
      <div>
        <h3 class="text-2xl font-bold text-slate-800 mb-8 flex items-center">
          <span class="mr-3">🏢</span> Companies & Ventures
        </h3>
        <div class="grid md:grid-cols-2 gap-8">
    `;
    
    data.companies.forEach(company => {
      html += createCompanyCard(company);
    });
    
    html += `</div></div>`;
  }

  container.innerHTML = html;
}

function createFeaturedProjectCard(project) {
  return `
    <div class="card bg-white border border-gray-200 hover:border-black hover:shadow-lg transition-all duration-300 group cursor-pointer touch-manipulation active:scale-98">
      <div class="relative overflow-hidden">
        <img src="${project.img}" alt="${project.title}" class="w-full h-48 object-cover grayscale group-hover:grayscale-0 transition-all duration-500">
        <div class="absolute top-4 right-4">
          <span class="px-3 py-1 bg-black text-white text-xs font-mono uppercase tracking-wider">
            ${project.status}
          </span>
        </div>
      </div>
      <div class="p-6 md:p-8">
        <div class="flex items-center justify-between mb-4">
          <span class="text-xs font-mono text-gray-500 uppercase tracking-wider">
            ${project.type}
          </span>
          <span class="text-xs font-mono text-gray-500">${project.year}</span>
        </div>
        <h4 class="text-xl font-light text-black mb-4 group-hover:text-gray-600 transition-colors">
          <a href="./project.html?id=${project.title.toLowerCase().replace(/\s+/g, '-')}" class="haptic-btn">${project.title}</a>
        </h4>
        <p class="text-gray-600 mb-6 leading-relaxed font-light">${project.desc.substring(0, 120)}...</p>
        <div class="flex flex-wrap gap-2">
          ${project.tech.slice(0, 4).map(tech => `
            <span class="text-xs font-mono text-gray-500">${tech}</span>
          `).join('<span class="text-gray-300 mx-1">•</span>')}
        </div>
      </div>
    </div>
  `;
}

function createRegularProjectCard(project) {
  return `
    <div class="card bg-white border border-gray-200 hover:border-black hover:shadow-md transition-all duration-300 group cursor-pointer touch-manipulation active:scale-98">
      <div class="relative overflow-hidden">
        <img src="${project.img}" alt="${project.title}" class="w-full h-32 object-cover grayscale group-hover:grayscale-0 transition-all duration-500">
        <div class="absolute top-2 right-2">
          <span class="px-2 py-1 bg-black text-white text-xs font-mono">
            ${project.status}
          </span>
        </div>
      </div>
      <div class="p-4 md:p-6">
        <div class="flex items-center justify-between mb-3">
          <span class="text-xs font-mono text-gray-500 uppercase tracking-wider">${project.type}</span>
          <span class="text-xs font-mono text-gray-400">${project.year}</span>
        </div>
        <h4 class="font-light text-black mb-3 group-hover:text-gray-600 transition-colors">
          <a href="./project.html?id=${project.title.toLowerCase().replace(/\s+/g, '-')}" class="haptic-btn">${project.title}</a>
        </h4>
        <p class="text-sm text-gray-600 mb-4 font-light leading-relaxed">${project.desc.substring(0, 100)}...</p>
        <div class="text-xs font-mono text-gray-400">
          ${project.tech.slice(0, 3).join(' • ')}
        </div>
      </div>
    </div>
  `;
}

function createCompanyCard(company) {
  return `
    <div class="bg-white border border-gray-200 hover:border-black transition-all duration-300 p-8">
      <div class="flex items-center justify-between mb-4">
        <span class="text-xs font-mono text-gray-500 uppercase tracking-wider">
          ${company.type}
        </span>
        <span class="text-xs font-mono text-gray-400">${company.year}</span>
      </div>
      <h4 class="text-xl font-light text-black mb-2">${company.title}</h4>
      <p class="text-gray-600 font-mono text-sm mb-4 uppercase tracking-wider">${company.role}</p>
      <p class="text-gray-600 leading-relaxed font-light">${company.desc}</p>
    </div>
  `;
}

// Unified navigation system for desktop and mobile
function setupNavigation() {
  const desktopNavButtons = document.querySelectorAll('.desktop-nav .nav-dot');
  const mobileNavButtons = document.querySelectorAll('.mobile-nav .mobile-nav-btn');
  const allNavButtons = [...desktopNavButtons, ...mobileNavButtons];
  const sections = ['hero', 'about', 'skills', 'projects', 'contact'].map(id => document.getElementById(id));

  // Click handlers for all navigation buttons
  allNavButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = button.dataset.target.substring(1);
      const target = document.getElementById(targetId);
      if (target) {
        // Smooth scroll with dynamic offset for mobile navigation
        let offset = 0;
        if (window.innerWidth < 1024) {
          // Get actual mobile nav height dynamically
          const mobileNav = document.querySelector('.mobile-nav');
          if (mobileNav) {
            offset = mobileNav.offsetHeight;
          } else {
            offset = 60; // fallback
          }
        }
        const targetPosition = target.offsetTop - offset;
        
        // Enhanced smooth scrolling with custom easing
        smoothScrollTo(targetPosition, 800);
        
        triggerHaptic('navigation');
				}
			});
	});

  // Enhanced scroll spy for both navigation systems
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        
        // Update desktop navigation
        desktopNavButtons.forEach(btn => {
          const isActive = btn.dataset.target === `#${id}`;
          btn.setAttribute('aria-current', isActive ? 'true' : 'false');
          btn.classList.toggle('active', isActive);
          if (isActive) {
            btn.style.backgroundColor = '#000';
            btn.style.transform = 'scale(1.3)';
          } else {
            btn.style.backgroundColor = '#d1d5db';
            btn.style.transform = 'scale(1)';
          }
        });
        
        // Update mobile navigation
        mobileNavButtons.forEach(btn => {
          const isActive = btn.dataset.target === `#${id}`;
          btn.setAttribute('aria-current', isActive ? 'true' : 'false');
          btn.classList.toggle('active', isActive);
          
          const dot = btn.querySelector('.nav-dot');
          const label = btn.querySelector('.nav-text');
          
          if (dot) {
            if (isActive) {
              dot.className = 'nav-dot bg-black';
              dot.style.transform = 'scale(1.2)';
            } else {
              dot.className = 'nav-dot bg-gray-400';
              dot.style.transform = 'scale(1)';
            }
          }
          
          if (label) {
            if (isActive) {
              label.className = 'nav-text font-mono text-black';
            } else {
              label.className = 'nav-text font-mono text-gray-400';
            }
          }
        });
      }
    });
  }, { 
    threshold: 0.3,
    rootMargin: '-10% 0px -10% 0px'
  });

  sections.forEach(section => {
    if (section) observer.observe(section);
  });

  // Keyboard navigation (desktop only)
  document.addEventListener('keydown', (e) => {
    if (window.innerWidth >= 1024 && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      e.preventDefault();
      const currentActive = document.querySelector('.desktop-nav .nav-dot[aria-current="true"]');
      if (currentActive) {
        const currentIndex = Array.from(desktopNavButtons).indexOf(currentActive);
        const nextIndex = e.key === 'ArrowDown' 
          ? Math.min(currentIndex + 1, desktopNavButtons.length - 1)
          : Math.max(currentIndex - 1, 0);
        desktopNavButtons[nextIndex].click();
      }
    }
  });
}

// Smooth animations for elements entering viewport
function setupScrollAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
      }
    });
  }, { threshold: 0.1 });

  // Animate sections on scroll
  document.querySelectorAll('section').forEach((section, index) => {
    section.style.opacity = '0';
    section.style.transform = 'translateY(30px)';
    section.style.transition = `opacity 0.8s ease ${index * 0.1}s, transform 0.8s ease ${index * 0.1}s`;
    observer.observe(section);
  });
}

// Add some fun interactions
function addFunInteractions() {
  // Emoji reactions on hover
  const emojiElements = document.querySelectorAll('span');
  emojiElements.forEach(el => {
    if (/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]/u.test(el.textContent)) {
      el.style.cursor = 'pointer';
      el.addEventListener('mouseenter', () => {
        el.style.transform = 'scale(1.2) rotate(10deg)';
        el.style.transition = 'transform 0.2s ease';
      });
      el.addEventListener('mouseleave', () => {
        el.style.transform = 'scale(1) rotate(0deg)';
      });
    }
  });

  // Add a subtle parallax effect to background elements
  window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const backgrounds = document.querySelectorAll('.absolute');
    backgrounds.forEach((bg, index) => {
      const speed = 0.1 + (index * 0.05);
      bg.style.transform = `translateY(${scrolled * speed}px)`;
    });
  });
}

// Simplified mobile navigation setup for Galaxy S25 and other devices
function setupMobileNav() {
  const mobileNav = document.querySelector('.mobile-nav');
  if (!mobileNav) return;
  
  function updateMobileNav() {
    const viewportWidth = window.innerWidth;
    
    // Only apply to mobile screens
    if (viewportWidth >= 1024) {
      document.body.style.paddingBottom = '0';
      return;
    }
    
    console.log('Galaxy S25 viewport width:', viewportWidth);
    
    // Fixed height for consistency across all devices
    const navHeight = 56;
    
    // Force viewport constraints
    mobileNav.style.width = '100vw';
    mobileNav.style.maxWidth = '100vw';
    mobileNav.style.height = `${navHeight}px`;
    mobileNav.style.left = '0';
    mobileNav.style.right = 'auto';
    mobileNav.style.padding = '8px 4px';
    mobileNav.style.boxSizing = 'border-box';
    mobileNav.style.overflow = 'hidden';
    
    // Update body padding
    document.body.style.paddingBottom = `${navHeight + 20}px`; // Extra 20px buffer
    document.body.style.width = '100vw';
    document.body.style.maxWidth = '100vw';
    document.body.style.overflowX = 'hidden';
    
    // Update section scroll margins
    document.querySelectorAll('section').forEach(section => {
      section.style.scrollMarginTop = `${navHeight}px`;
      section.style.width = '100vw';
      section.style.maxWidth = '100vw';
      section.style.overflowX = 'hidden';
    });
    
    // Ensure footer has proper spacing above mobile nav
    const footer = document.querySelector('#contact');
    if (footer) {
      footer.style.marginBottom = `${navHeight + 20}px`;
      footer.style.width = '100vw';
      footer.style.maxWidth = '100vw';
      footer.style.overflowX = 'hidden';
    }
    
    console.log('Mobile nav configured for viewport:', viewportWidth);
  }
  
  // Initial setup
  updateMobileNav();
  
  // Update on resize and orientation change
  window.addEventListener('resize', updateMobileNav, { passive: true });
  window.addEventListener('orientationchange', () => {
    setTimeout(updateMobileNav, 300);
  }, { passive: true });
}

// Initialize everything
document.addEventListener('DOMContentLoaded', () => {
  // Initialize universal haptic feedback FIRST
  addUniversalHapticFeedback();
  
  // Initialize smooth scrolling for all links
  initializeSmoothScrolling();
  
  // Setup mobile navigation
  setupMobileNav();
  
  // Then initialize other features
  loadProjects();
  setupNavigation(); // Use new unified navigation system
  setupScrollAnimations();
  addFunInteractions();
  
  // Add mobile-specific optimizations
  if ('ontouchstart' in window) {
    document.body.classList.add('touch-device');
    
    // Improve touch scrolling
    document.documentElement.style.webkitOverflowScrolling = 'touch';
    
    // Add enhanced touch feedback
    document.addEventListener('touchstart', function() {}, { passive: true });
    
    // Add gesture recognition
    addGestureHaptics();
  }
  
  // Add page load completion haptic
  setTimeout(() => {
    triggerHaptic('success');
  }, 500);
});

// Additional gesture-based haptics
function addGestureHaptics() {
  let touchStartY = 0;
  let touchStartX = 0;
  
  document.addEventListener('touchstart', (e) => {
    touchStartY = e.touches[0].clientY;
    touchStartX = e.touches[0].clientX;
  }, { passive: true });
  
  document.addEventListener('touchmove', (e) => {
    const touchY = e.touches[0].clientY;
    const touchX = e.touches[0].clientX;
    const deltaY = touchStartY - touchY;
    const deltaX = touchStartX - touchX;
    
    // Detect swipe gestures and provide haptic feedback
    if (Math.abs(deltaY) > 50 || Math.abs(deltaX) > 50) {
      // Only trigger once per gesture
      if (Math.abs(deltaY) > Math.abs(deltaX)) {
        // Vertical swipe
        if (deltaY > 0) {
          // Swipe up
          triggerHaptic('navigation');
        } else {
          // Swipe down
          triggerHaptic('navigation');
        }
      } else {
        // Horizontal swipe
        triggerHaptic('medium');
      }
      
      // Reset to prevent multiple triggers
      touchStartY = touchY;
      touchStartX = touchX;
    }
  }, { passive: true });
  
  // Pull to refresh gesture (if at top of page)
  document.addEventListener('touchstart', (e) => {
    if (window.scrollY === 0) {
      const touch = e.touches[0];
      touchStartY = touch.clientY;
    }
  }, { passive: true });
  
  document.addEventListener('touchmove', (e) => {
    if (window.scrollY === 0) {
      const touch = e.touches[0];
      const deltaY = touch.clientY - touchStartY;
      
      if (deltaY > 100) {
        triggerHaptic('heavy');
        touchStartY = touch.clientY; // Reset to prevent multiple triggers
      }
    }
  }, { passive: true });
}

