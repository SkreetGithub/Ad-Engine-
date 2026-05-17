/** Predicts profit from input vector. Linear model so engine runs without TensorFlow. */
export class NeuralProfitBrain {
  private weights: number[] = [0.1, 0.2, -0.01, 0.05, 0, 0]
  private bias = 0

  async train(dataset: { input: number[]; reward: number }[]): Promise<void> {
    if (dataset.length < 2) return
    const lr = 0.01
    for (let e = 0; e < 20; e++) {
      for (const d of dataset) {
        const pred = this.predict(d.input)
        const err = d.reward - pred
        for (let i = 0; i < this.weights.length && i < d.input.length; i++) {
          this.weights[i] = this.weights[i]! + lr * err * (d.input[i] ?? 0)
        }
        this.bias += lr * err
      }
    }
  }

  predict(input: number[]): number {
    let sum = this.bias
    for (let i = 0; i < this.weights.length && i < input.length; i++) {
      sum += this.weights[i]! * (input[i] ?? 0)
    }
    return sum
  }
}
