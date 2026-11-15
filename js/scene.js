// true only if the element AND all its parents are visible
function isShown(el) {
  for (; el && !el.isScene; el = el.parentEl) {
    if (el.object3D && !el.object3D.visible) return false;
  }
  return true;
}

// only visible .clickable elements can be clicked
function refreshClickables() {
  document.querySelectorAll('.clickable').forEach(el =>
    el.classList.toggle('inactive', !isShown(el)));
  document.querySelector('#cursor').components.raycaster.refreshObjects();
}

function goTo(name) {
  document.querySelector('#sky').setAttribute('src', '#pano-' + name);
  ['room', 'lounge', 'terrace'].forEach(n =>
    document.querySelector('#' + n).setAttribute('visible', n === name));
  refreshClickables();
    // start the "on-enter" animations of the panorama we just entered
  document.querySelectorAll('#' + name + ' .on-enter').forEach(el => el.emit('show'));
}


// click → show/hide another element
AFRAME.registerComponent('toggle', {
  schema: { target: { type: 'selector' } },
  init() {
    this.el.addEventListener('click', () => {
      const t = this.data.target;
      t.setAttribute('visible', !t.getAttribute('visible'));
      refreshClickables();
    });
  }
});

// click → go to another panorama
AFRAME.registerComponent('go-to', {
  schema: { target: { type: 'string' } },
  init() {
    this.el.addEventListener('click', () => goTo(this.data.target));
  }
});

// click → open the keypad
AFRAME.registerComponent('open-keypad', {
  init() {
    this.el.addEventListener('click', () => {
      document.querySelector('#keypad').setAttribute('visible', true);
      refreshClickables();
    });
  }
});

// numeric keypad: 3x4 buttons + display, checks the code
AFRAME.registerComponent('keypad', {
  schema: { code: { type: 'string', default: '1907' } },
  init() {
    this.input = '';
    this.done = false;

    const back = document.createElement('a-plane');
    back.setAttribute('width', 1.1);
    back.setAttribute('height', 1.45);
    back.setAttribute('position', '0 0.05 -0.01');
    back.setAttribute('color', '#111');
    back.setAttribute('opacity', 0.85);
    this.el.appendChild(back);

    this.display = document.createElement('a-text');
    this.display.setAttribute('value', '____');
    this.display.setAttribute('align', 'center');
    this.display.setAttribute('width', 3);
    this.display.setAttribute('color', '#7CFC00');
    this.display.setAttribute('position', '0 0.58 0');
    this.el.appendChild(this.display);

    ['1','2','3','4','5','6','7','8','9','C','0','OK'].forEach((k, i) => {
      const b = document.createElement('a-plane');
      b.classList.add('clickable');
      b.setAttribute('width', 0.28);
      b.setAttribute('height', 0.2);
      b.setAttribute('color', '#333');
      b.setAttribute('position', `${(i % 3 - 1) * 0.32} ${0.3 - Math.floor(i / 3) * 0.25} 0`);
      b.setAttribute('text', `value: ${k}; align: center; width: 2.5; color: #fff`);
      b.setAttribute('animation__enter', 'property: material.color; to: #666; startEvents: mouseenter; dur: 100');
      b.setAttribute('animation__leave', 'property: material.color; to: #333; startEvents: mouseleave; dur: 100');
      b.addEventListener('click', () => this.press(k));
      this.el.appendChild(b);
    });
  },

    press(k) {
    if (this.done) return;
    clearTimeout(this.resetTimer);                    
    this.display.setAttribute('color', '#7CFC00');    
    if (k === 'C') this.input = '';
    else if (k === 'OK') return this.check();
    else if (this.input.length < 4) this.input += k;
    this.display.setAttribute('value', this.input.padEnd(4, '_'));
  },

  check() {
    if (this.input === this.data.code) {
      this.done = true;
      this.display.setAttribute('value', 'OPEN');
      const label = document.querySelector('#doorLabel');
      label.setAttribute('value', 'Garden door: unlocked');
      label.setAttribute('color', '#2ecc71');
      const box = document.querySelector('#doorBox');
      box.removeAttribute('animation');
      box.setAttribute('material', 'color: #1e8449; emissive: #2ecc71; emissiveIntensity: 1');
      setTimeout(() => goTo('terrace'), 1500);
    } else {
      this.display.setAttribute('value', 'WRONG');
      this.display.setAttribute('color', '#ff4d4d');  
      this.input = '';
      this.resetTimer = setTimeout(() => {
        this.display.setAttribute('value', '____');
        this.display.setAttribute('color', '#7CFC00');
      }, 1000);
    }
  }
  }
);


document.addEventListener('DOMContentLoaded', () => {
  document.querySelector('a-scene').addEventListener('loaded', () => goTo('room'));
});