import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'
import { VignetteShader } from 'three/examples/jsm/shaders/VignetteShader.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { GlitchPass } from 'three/examples/jsm/postprocessing/GlitchPass.js'
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js'
import CustomShaderMaterial from "three-custom-shader-material/vanilla"
import vertex from './shader.vert?raw'

let autoRotate = true

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

const pointLight = new THREE.PointLight(0xffffff, 100)
pointLight.position.set(2, 2.5, 0)
scene.add(pointLight)

const pointLightHelper = new THREE.PointLightHelper(pointLight, 1)
scene.add(pointLightHelper)

const textureLoader = new THREE.TextureLoader()
const texture = textureLoader.load('/brick.png')

texture.colorSpace = THREE.SRGBColorSpace
texture.minFilter = THREE.NearestFilter
texture.magFilter = THREE.NearestFilter

const geometry = new THREE.BoxGeometry(1.7, 1.7, 1.7)
const baseMaterial = new THREE.MeshStandardMaterial({ map: texture })
const material = new CustomShaderMaterial({
        baseMaterial: baseMaterial,
        vertexShader: vertex,
        flatShading: true,
        color: 0xff00ff,
})

const cube = new THREE.Mesh(geometry, material)
scene.add(cube)

camera.position.z = 5
cube.rotation.x = 0.5

const vignettePass = new ShaderPass(VignetteShader)
vignettePass.uniforms["offset"].value = 1.0
vignettePass.uniforms["darkness"].value = 1.5

const bloomPass = new UnrealBloomPass(
        new THREE.Vector2(window.innerWidth, window.innerHeight),
        1.5,
        0.4,
        100
)

const glitchPass = new GlitchPass(0.01)

composer.addPass(bloomPass)
composer.addPass(vignettePass)
composer.addPass(glitchPass)

function animate() {
        if (autoRotate) {
                cube.rotation.y += 0.01
        }

        controls.update()
        composer.render()
}
renderer.setAnimationLoop(animate)