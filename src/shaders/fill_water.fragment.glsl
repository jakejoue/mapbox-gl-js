#define TAU 6.28318530718
#define MAX_ITER 5
#define INTENSITY 0.004
#define SCALE 1000.0

uniform lowp float u_time;

void main() {
    vec2 uv = gl_FragCoord.xy / SCALE;
    vec2 p = mod(uv * TAU, TAU) - 250.0;
    vec2 i = vec2(p);
    float c = 1.0;
	
    for (int n = 0; n < MAX_ITER; n++) {
		float t = 0.5 * u_time * (1.0 - (3.5 / float(n + 1)));
		i = p + vec2(cos(t - i.x) + sin(t + i.y), sin(t - i.y) + cos(t + i.x));
		c += 1.0 / length(vec2(p.x / (sin(i.x + t) / INTENSITY), p.y / (cos(i.y + t) / INTENSITY)));
    }
    c = 1.17 - pow(c / float(MAX_ITER), 1.4);
	
    gl_FragColor = vec4(clamp(vec3(pow(abs(c), 8.0)) + vec3(0.0, 0.35, 0.5), 0.0, 1.0), 1.0);
	
}