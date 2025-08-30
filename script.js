// Set current year
document.getElementById('year').textContent = new Date().getFullYear();

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

  // 6. Scroll feedback (throttled)
  let scrollTimeout;
  let lastScrollY = window.scrollY;
  
  window.addEventListener('scroll', () => {
    const currentScrollY = window.scrollY;
    const scrollDelta = Math.abs(currentScrollY - lastScrollY);
    
    // Only trigger haptic on significant scroll movement
    if (scrollDelta > 50) {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        triggerHaptic('scroll');
      }, 100);
      lastScrollY = currentScrollY;
    }
  }, { passive: true });

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
          <span class="mr-3">⭐</span> Featured Projects
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

// Side navigation
function setupSideNav() {
  const navButtons = document.querySelectorAll('nav[aria-label="Section navigation"] button');
  const sections = ['hero', 'about', 'skills', 'projects', 'contact'].map(id => document.getElementById(id));

  // Click handlers
  navButtons.forEach(button => {
    button.addEventListener('click', () => {
      const targetId = button.dataset.target.substring(1);
      const target = document.getElementById(targetId);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // Scroll spy
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        navButtons.forEach((btn, index) => {
          const isActive = btn.dataset.target === `#${id}`;
          btn.setAttribute('aria-current', isActive ? 'true' : 'false');
          btn.classList.toggle('bg-black', isActive);
          btn.classList.toggle('bg-gray-300', !isActive);
          btn.classList.toggle('bg-gray-200', !isActive);
        });
      }
    });
  }, { threshold: 0.5 });

  sections.forEach(section => {
    if (section) observer.observe(section);
  });

  // Keyboard navigation
  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      const currentActive = document.querySelector('nav[aria-label="Section navigation"] button[aria-current="true"]');
      if (currentActive) {
        const currentIndex = Array.from(navButtons).indexOf(currentActive);
        const nextIndex = e.key === 'ArrowDown' 
          ? Math.min(currentIndex + 1, navButtons.length - 1)
          : Math.max(currentIndex - 1, 0);
        navButtons[nextIndex].click();
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

// Initialize everything
document.addEventListener('DOMContentLoaded', () => {
  // Initialize universal haptic feedback FIRST
  addUniversalHapticFeedback();
  
  // Then initialize other features
  loadProjects();
  setupSideNav();
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
  
  // Handle mobile navigation with haptic feedback
  let lastScrollY = window.scrollY;
  const mobileNav = document.querySelector('nav[aria-label="Mobile navigation"]');
  
  if (mobileNav) {
    window.addEventListener('scroll', () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        // Scrolling down, hide mobile nav with haptic
        mobileNav.style.transform = 'translateX(-50%) translateY(100px)';
        mobileNav.style.opacity = '0';
        triggerHaptic('light');
      } else if (currentScrollY < lastScrollY) {
        // Scrolling up, show mobile nav with haptic
        mobileNav.style.transform = 'translateX(-50%) translateY(0)';
        mobileNav.style.opacity = '1';
        triggerHaptic('light');
      }
      
      lastScrollY = currentScrollY;
    }, { passive: true });
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

