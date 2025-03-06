import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'
import { VignetteShader } from 'three/examples/jsm/shaders/VignetteShader.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { GlitchPass } from 'three/examples/jsm/postprocessing/GlitchPass.js'
import { DotScreenPass } from 'three/examples/jsm/postprocessing/DotScreenPass.js'
import { BokehPass } from 'three/examples/jsm/postprocessing/BokehPass.js'
import { FilmPass } from 'three/examples/jsm/postprocessing/FilmPass.js'
import { HalftonePass } from 'three/examples/jsm/postprocessing/HalftonePass.js'
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js'
import CustomShaderMaterial from "three-custom-shader-material/vanilla"
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import vertex from './shader.vert?raw'
import fragment from './shader.frag?raw'

let autoRotate = true
let pointerDown = false
let changeTexture = true
let textureIndex = 0
let rainbowOffset = 0
let score = 0
const effects = [{
        glitch: false,
        rainbow: false,
        bloom: false,
        vignette: false,
        dotScreen: false,
        half: false,
        film: false,
        bokeh: false,
}]

const scene = new THREE.Scene()
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)

const renderer = new THREE.WebGLRenderer()
renderer.colorSpace = THREE.SRGBColorSpace
renderer.setSize(window.innerWidth, window.innerHeight)
document.body.appendChild(renderer.domElement)

const rgbeLoader = new RGBELoader()
rgbeLoader.load('/hdr.hdr', function (texture) {
        texture.mapping = THREE.EquirectangularReflectionMapping
        scene.environment = texture
        scene.background = texture
})

const composer = new EffectComposer(renderer)
const renderPass = new RenderPass(scene, camera)
composer.addPass(renderPass)

const controls = new OrbitControls(camera, renderer.domElement)
controls.enableDamping = true
controls.dampingFactor = 0.25
controls.screenSpacePanning = false
controls.minDistance = 3
controls.maxDistance = 10

controls.addEventListener('start', () => {
        autoRotate = false
})
controls.addEventListener('end', () => {
        autoRotate = true
})

const pointLight = new THREE.PointLight(0xffffff, 1)
pointLight.position.set(2, 2.5, 0)
scene.add(pointLight)

let textures = []
const texturesList = ["brick", "cobblestone", "diamond_ore", "grass_block_top", "netherrack", "sponge", "enchant", "end", "glowstone", "none", "pumkin", "spawner", "tnt"]

for (const src of texturesList) {
        const textureLoader = new THREE.TextureLoader()
        const texture = textureLoader.load(src + '.png')

        texture.colorSpace = THREE.SRGBColorSpace
        texture.minFilter = THREE.NearestFilter
        texture.magFilter = THREE.NearestFilter

        textures.push(texture)
}


const geometry = new THREE.BoxGeometry(1.7, 1.7, 1.7)
const material = new CustomShaderMaterial({
        baseMaterial: THREE.MeshStandardMaterial,
        vertexShader: vertex,
        fragmentShader: fragment,
        flatShading: true,
        map: textures[textureIndex],
        uniforms: {
                scroll: { value: 0 },
                canScroll: { value: false },
        }
})

const cube = new THREE.Mesh(geometry, material)
scene.add(cube)

camera.position.z = 5
cube.rotation.x = 0.5

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

function onPointerClick(event) {
        pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
        pointer.y = - (event.clientY / window.innerHeight) * 2 + 1;
}

const loader = new FontLoader();
let textGeometry;
let text;

function loadScoreText(txt) {
        loader.load('/mc.json', function (font) {
                textGeometry = new TextGeometry(`${txt}`, {
                        font: font,
                        size: 0.3,
                        depth: 0.1,
                        curveSegments: 500,
                        bevelEnabled: true,
                        bevelThickness: 0.01,
                        bevelSize: 0.01,
                        bevelOffset: 0,
                        bevelSegments: 3
                });
                const material = new THREE.MeshStandardMaterial({ color: 0x25272F })
                text = new THREE.Mesh(textGeometry, material)

                textGeometry.center()
                text.position.y = 2.5
                scene.add(text)

                const planeGeometry = new THREE.PlaneGeometry(5, 1);
                const planeMaterial = new THREE.MeshBasicMaterial({ color: 0xf0f0f0 });
                const plane = new THREE.Mesh(planeGeometry, planeMaterial);

                plane.position.z = -0.1;
                planeGeometry.center()
                plane.position.y = text.position.y
                scene.add(plane);
        })
}

loadScoreText(score)

// post processing
const vignettePass = new ShaderPass(VignetteShader)
vignettePass.uniforms["offset"].value = 1.0
vignettePass.uniforms["darkness"].value = 1.5

const bloomPass = new UnrealBloomPass(
        new THREE.Vector2(window.innerWidth, window.innerHeight),
        4,
        20,
        0.9
)
const glitchPass = new GlitchPass(0.3)
const dotScreenPass = new DotScreenPass()
const bokehPass = new BokehPass(scene, camera, { focus: 8, aperture: 0.005, maxblur: 0.018 })
const filmPass = new FilmPass()
const halftonePass = new HalftonePass(100, 100)

function animate() {
        if (autoRotate) {
                cube.rotation.y += 0.01
        }

        if (score >= 200 && !effects['bloom']) {
                composer.addPass(bloomPass)
                effects['bloom'] = true
        }
        if (score >= 500 && !effects['vignette']) {
                composer.addPass(vignettePass)
                effects['vignette'] = true
        }
        if (score >= 700 && !effects['glitch']) {
                composer.addPass(glitchPass)
                effects['glitch'] = true
        }
        if (score >= 1000 && !effects['rainbow']) {
                material.uniforms.canScroll.value = true
                rainbowOffset = 0.3
                effects['rainbow'] = true
        }
        if (score >= 1500) {
                rainbowOffset = 2
        }
        if (score >= 2000 && !effects['film']) {
                composer.addPass(filmPass)
                effects['film'] = true
        }
        if (score >= 3000 && !effects['dotScreen']) {
                composer.addPass(dotScreenPass)
                effects['dotScreen'] = true
        }
        if (score >= 5000 && !effects['bokeh']) {
                composer.addPass(bokehPass)
                effects['bokeh'] = true
        }
        if (score >= 10000 && !effects['half']) {
                composer.addPass(halftonePass)
                effects['half'] = true
        }
        material.uniforms.scroll.value += rainbowOffset

        if (pointerDown) {
                raycaster.setFromCamera(pointer, camera);

                const intersects = raycaster.intersectObject(cube);
                for (let i = 0; i < intersects.length; i++) {
                        intersects[i].object.scale.set(1.2, 1.2, 1.2)
                        if (changeTexture) {
                                textureIndex = Math.floor(Math.random() * 6)
                                material.map = textures[textureIndex]

                                score += Math.floor(Math.random() * (15 - 5 + 1)) + 5
                                scene.remove(text)
                                textGeometry.dispose()
                                loadScoreText(score)

                                changeTexture = false
                        }
                }
        } else {
                changeTexture = true
                cube.scale.set(1, 1, 1)
        }

        controls.update()
        composer.render()
}
window.addEventListener('click', onPointerClick);
window.addEventListener('pointerdown', () => {
        pointerDown = true
})
window.addEventListener('pointerup', () => {
        pointerDown = false
})
const audio = new Audio('/minecraft.mp3');
audio.loop = true;
window.addEventListener('click', () => {
        audio.play();
});
renderer.setAnimationLoop(animate)