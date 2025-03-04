uniform float time;
uniform float amplitude;
uniform float frequency;

void main() {
        vec3 pos = position;
        pos.z += sin(pos.x * frequency + time) * amplitude;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}