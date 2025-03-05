precision mediump float;

uniform float scroll;
uniform bool canScroll;
in vec2 vUv;

void main() {
        vec2 uv = vUv;
        vec3 color = csm_FragColor.xyz;
        float t = scroll * 0.4;

        color.r += sin(uv.x * 6.28 + t) * 0.5 + 0.5;
        color.g += sin(uv.x * 6.28 + t + 2.094) * 0.5 + 0.5;
        color.b += sin(uv.x * 6.28 + t + 4.188) * 0.5 + 0.5;
        
        if (canScroll == false) {
                csm_FragColor = csm_FragColor;
        } else {
                csm_FragColor = vec4(color, 1.0);
        }
}