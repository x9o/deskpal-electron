#include <windows.h>
#include <iostream>

void SetNightLight(bool enable) {
    HDC hdc = GetDC(NULL);
    if (hdc) {
        WORD gammaRamp[3][256];
        for (int i = 0; i < 256; i++) {
            gammaRamp[0][i] = gammaRamp[1][i] = gammaRamp[2][i] = static_cast<WORD>(i * 257);
            if (enable) {
                gammaRamp[2][i] = static_cast<WORD>(i * 200); // Reduce blue channel
            }
        }
        if (!SetDeviceGammaRamp(hdc, gammaRamp)) {
            std::cerr << "Failed to set gamma ramp. Error: " << GetLastError() << std::endl;
        }
        ReleaseDC(NULL, hdc);
    } else {
        std::cerr << "Failed to get device context." << std::endl;
    }
}

int main() {
    std::cout << "Enabling night light..." << std::endl;
    SetNightLight(true);  // Enable night light

    // Wait for 5 seconds (5000 milliseconds)
    Sleep(10000);

    std::cout << "Disabling night light..." << std::endl;
    SetNightLight(false);  // Disable night light

    return 0;
}

// g++ -fdiagnostics-color=always -g nightlight.cpp -o nightlight.exe -lgdi32
// ./nightlight.exe