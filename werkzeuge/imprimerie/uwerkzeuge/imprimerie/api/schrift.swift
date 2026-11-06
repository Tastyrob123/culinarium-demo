// Findet Schrift in einem Bild (macOS Vision). Ausgabe je Fund: Höhe-Anteil, Sicherheit, Text. Für die Plakatwerkstatt (29.10.).
import Foundation
import Vision
let url = URL(fileURLWithPath: CommandLine.arguments[1])
let req = VNRecognizeTextRequest()
req.recognitionLevel = .accurate
req.usesLanguageCorrection = false
req.minimumTextHeight = 0.008
try VNImageRequestHandler(url: url).perform([req])
for o in req.results ?? [] {
    if let t = o.topCandidates(1).first {
        print(String(format: "%.3f\t%.2f\t%@", o.boundingBox.height, t.confidence, t.string))
    }
}
