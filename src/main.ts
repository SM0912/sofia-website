import './style.css'
import * as THREE from 'three'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger)

class PortfolioExperience {
  private scene: THREE.Scene
  private camera: THREE.PerspectiveCamera
  private renderer: THREE.WebGLRenderer
  private canvas: HTMLCanvasElement
  private particles: THREE.Points
  private geometricShapes: THREE.Group
  private mouse = new THREE.Vector2()
  private raycaster = new THREE.Raycaster()
  private clock = new THREE.Clock()
  private backgroundColors = [
    new THREE.Color(0x0a0a0a), // Dark
    new THREE.Color(0x1a0a2e), // Deep Purple
    new THREE.Color(0x16213e), // Dark Blue
    new THREE.Color(0x0f3460), // Navy
    new THREE.Color(0x533a71), // Purple
    new THREE.Color(0x2d1b69), // Indigo
    new THREE.Color(0x0e4b99), // Blue
    new THREE.Color(0x2e8b57), // Sea Green
    new THREE.Color(0x8b0000), // Dark Red
    new THREE.Color(0x4b0082)  // Indigo
  ]
  private currentColorIndex = 0
  private targetColor = new THREE.Color()
  private currentColor = new THREE.Color()

  constructor() {
    this.canvas = document.getElementById('three-canvas') as HTMLCanvasElement
    this.init()
    this.createParticleSystem()
    this.createGeometricShapes()
    this.setupEventListeners()
    this.setupScrollAnimations()
    this.setupBackgroundColorAnimation()
    this.animate()
    this.hideLoadingScreen()
  }

  private init() {
    // Scene
    this.scene = new THREE.Scene()
    this.currentColor.copy(this.backgroundColors[0])
    this.targetColor.copy(this.backgroundColors[1])
    this.scene.fog = new THREE.Fog(this.currentColor.getHex(), 50, 200)

    // Camera
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    )
    this.camera.position.z = 30

    // Renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: true
    })
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.setClearColor(this.currentColor.getHex(), 1)
  }

  private setupBackgroundColorAnimation() {
    // Animate background color changes every 3 seconds
    const colorTimeline = gsap.timeline({ repeat: -1 })
    
    this.backgroundColors.forEach((color, index) => {
      const nextIndex = (index + 1) % this.backgroundColors.length
      const nextColor = this.backgroundColors[nextIndex]
      
      colorTimeline.to(this.currentColor, {
        r: nextColor.r,
        g: nextColor.g,
        b: nextColor.b,
        duration: 3,
        ease: "power2.inOut",
        onUpdate: () => {
          this.renderer.setClearColor(this.currentColor.getHex(), 1)
          this.scene.fog.color.copy(this.currentColor)
          
          // Update particle colors to complement background
          const particleGeometry = this.particles.geometry
          const colors = particleGeometry.attributes.color.array as Float32Array
          
          for (let i = 0; i < colors.length; i += 3) {
            const complementColor = new THREE.Color()
            complementColor.setHSL(
              (this.currentColor.getHSL({h: 0, s: 0, l: 0}).h + 0.5) % 1,
              0.7,
              0.6 + Math.sin(this.clock.getElapsedTime() * 0.5 + i * 0.01) * 0.2
            )
            colors[i] = complementColor.r
            colors[i + 1] = complementColor.g
            colors[i + 2] = complementColor.b
          }
          particleGeometry.attributes.color.needsUpdate = true
        }
      })
    })
  }

  private createParticleSystem() {
    const particleCount = 2000
    const positions = new Float32Array(particleCount * 3)
    const colors = new Float32Array(particleCount * 3)

    for (let i = 0; i < particleCount * 3; i += 3) {
      // Position
      positions[i] = (Math.random() - 0.5) * 200
      positions[i + 1] = (Math.random() - 0.5) * 200
      positions[i + 2] = (Math.random() - 0.5) * 200

      // Color
      const color = new THREE.Color()
      color.setHSL(Math.random() * 0.3 + 0.5, 0.7, 0.5)
      colors[i] = color.r
      colors[i + 1] = color.g
      colors[i + 2] = color.b
    }

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))

    const material = new THREE.PointsMaterial({
      size: 2,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending
    })

    this.particles = new THREE.Points(geometry, material)
    this.scene.add(this.particles)
  }

  private createGeometricShapes() {
    this.geometricShapes = new THREE.Group()

    // Create various geometric shapes
    const shapes = [
      { geometry: new THREE.BoxGeometry(2, 2, 2), position: [-20, 10, -10] },
      { geometry: new THREE.SphereGeometry(1.5, 32, 32), position: [15, -8, -15] },
      { geometry: new THREE.ConeGeometry(1, 3, 8), position: [-10, -15, -5] },
      { geometry: new THREE.TorusGeometry(1.5, 0.5, 16, 100), position: [20, 5, -20] },
      { geometry: new THREE.OctahedronGeometry(2), position: [0, 20, -25] }
    ]

    shapes.forEach((shape, index) => {
      const material = new THREE.MeshPhongMaterial({
        color: new THREE.Color().setHSL((index * 0.2) % 1, 0.7, 0.5),
        transparent: true,
        opacity: 0.7,
        wireframe: Math.random() > 0.5
      })

      const mesh = new THREE.Mesh(shape.geometry, material)
      mesh.position.set(...shape.position)
      mesh.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      )

      this.geometricShapes.add(mesh)
    })

    this.scene.add(this.geometricShapes)

    // Add lighting with dynamic colors
    const ambientLight = new THREE.AmbientLight(0x404040, 0.4)
    this.scene.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0x00ff88, 1)
    directionalLight.position.set(10, 10, 5)
    this.scene.add(directionalLight)

    const pointLight = new THREE.PointLight(0x00d4ff, 0.8, 50)
    pointLight.position.set(-10, -10, 10)
    this.scene.add(pointLight)

    // Animate light colors to match background
    gsap.to(directionalLight.color, {
      r: 0.2,
      g: 0.8,
      b: 1,
      duration: 4,
      repeat: -1,
      yoyo: true,
      ease: "power2.inOut"
    })

    gsap.to(pointLight.color, {
      r: 1,
      g: 0.2,
      b: 0.8,
      duration: 6,
      repeat: -1,
      yoyo: true,
      ease: "power2.inOut"
    })
  }

  private setupEventListeners() {
    // Mouse movement
    window.addEventListener('mousemove', (event) => {
      this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1
      this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1
    })

    // Resize
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight
      this.camera.updateProjectionMatrix()
      this.renderer.setSize(window.innerWidth, window.innerHeight)
    })

    // Navigation
    this.setupNavigation()
  }

  private setupNavigation() {
    const navLinks = document.querySelectorAll('[data-section]')
    const sections = document.querySelectorAll('.section')

    navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault()
        const targetSection = (e.target as HTMLElement).getAttribute('data-section')
        const section = document.getElementById(targetSection!)
        
        if (section) {
          section.scrollIntoView({ behavior: 'smooth' })
        }
      })
    })

    // Update active nav link on scroll
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.id
          navLinks.forEach(link => {
            link.classList.remove('active')
            if (link.getAttribute('data-section') === id) {
              link.classList.add('active')
            }
          })
        }
      })
    }, { threshold: 0.5 })

    sections.forEach(section => observer.observe(section))
  }

  private setupScrollAnimations() {
    // Parallax effect for particles
    gsap.to(this.particles.rotation, {
      x: Math.PI * 2,
      duration: 20,
      repeat: -1,
      ease: "none"
    })

    // Animate geometric shapes on scroll
    this.geometricShapes.children.forEach((shape, index) => {
      gsap.to(shape.rotation, {
        x: Math.PI * 2,
        y: Math.PI * 2,
        duration: 10 + index * 2,
        repeat: -1,
        ease: "none"
      })
    })

    // Section animations
    gsap.utils.toArray('.project-card').forEach((card: any, index) => {
      gsap.fromTo(card, 
        { y: 100, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          delay: index * 0.2,
          scrollTrigger: {
            trigger: card,
            start: "top 80%",
            end: "bottom 20%",
            toggleActions: "play none none reverse"
          }
        }
      )
    })

    // Contact form animation
    gsap.fromTo('.contact-form', 
      { x: 100, opacity: 0 },
      {
        x: 0,
        opacity: 1,
        duration: 1,
        scrollTrigger: {
          trigger: '.contact-form',
          start: "top 80%",
          end: "bottom 20%",
          toggleActions: "play none none reverse"
        }
      }
    )
  }

  private animate() {
    requestAnimationFrame(() => this.animate())

    const elapsedTime = this.clock.getElapsedTime()

    // Animate particles
    if (this.particles) {
      this.particles.rotation.y = elapsedTime * 0.05
      this.particles.rotation.x = Math.sin(elapsedTime * 0.1) * 0.1
    }

    // Mouse interaction with camera
    this.camera.position.x += (this.mouse.x * 5 - this.camera.position.x) * 0.05
    this.camera.position.y += (-this.mouse.y * 5 - this.camera.position.y) * 0.05
    this.camera.lookAt(this.scene.position)

    // Animate geometric shapes
    this.geometricShapes.children.forEach((shape, index) => {
      const mesh = shape as THREE.Mesh
      mesh.position.y += Math.sin(elapsedTime + index) * 0.01
      mesh.position.x += Math.cos(elapsedTime + index) * 0.005
      
      // Update shape colors to complement background
      const material = mesh.material as THREE.MeshPhongMaterial
      const hue = (elapsedTime * 0.1 + index * 0.2) % 1
      material.color.setHSL(hue, 0.7, 0.5)
    })

    this.renderer.render(this.scene, this.camera)
  }

  private hideLoadingScreen() {
    setTimeout(() => {
      const loadingScreen = document.getElementById('loading-screen')
      if (loadingScreen) {
        gsap.to(loadingScreen, {
          opacity: 0,
          duration: 1,
          onComplete: () => {
            loadingScreen.style.display = 'none'
          }
        })
      }
    }, 2000)
  }
}

// Initialize the experience
new PortfolioExperience()

// Contact form handling
const contactForm = document.querySelector('.contact-form') as HTMLFormElement
if (contactForm) {
  contactForm.addEventListener('submit', (e) => {
    e.preventDefault()
    
    // Get form data
    const formData = new FormData(contactForm)
    const name = (contactForm.querySelector('input[type="text"]') as HTMLInputElement).value
    const email = (contactForm.querySelector('input[type="email"]') as HTMLInputElement).value
    const message = (contactForm.querySelector('textarea') as HTMLTextAreaElement).value
    
    // Simulate form submission
    const submitBtn = contactForm.querySelector('.btn') as HTMLButtonElement
    const originalText = submitBtn.textContent
    
    submitBtn.textContent = 'Sending...'
    submitBtn.disabled = true
    
    setTimeout(() => {
      submitBtn.textContent = 'Message Sent!'
      setTimeout(() => {
        submitBtn.textContent = originalText
        submitBtn.disabled = false
        contactForm.reset()
      }, 2000)
    }, 1500)
  })
}
