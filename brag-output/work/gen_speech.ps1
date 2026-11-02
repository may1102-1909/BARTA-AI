
Add-Type -AssemblyName System.Speech
$speak = New-Object System.Speech.Synthesis.SpeechSynthesizer
$speak.SetOutputToWaveFile("brag-output/work/test_speech.wav")
$speak.Speak("Hi, kya mai Tanmay se baat kar raha hoon?")
$speak.Dispose()
