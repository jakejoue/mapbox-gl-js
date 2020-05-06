/*
varying vec4 v_color;

void main() {
    gl_FragColor = v_color;

#ifdef OVERDRAW_INSPECTOR
    gl_FragColor = vec4(1.0);
#endif
}
*/

varying vec3 v_point;
varying vec4 v_top_color;
varying vec4 v_bottom_color;

void main() {
    gl_FragColor = vec4(1.0);

    float z = v_point.x;
    float b = v_point.y;
    float h = v_point.z;

    float percent = clamp((z - b) / (h - b), 0.0, 1.0);
    gl_FragColor = mix(v_bottom_color, v_top_color, percent);

#ifdef OVERDRAW_INSPECTOR
    gl_FragColor = vec4(1.0);
#endif
}
