# TreeWise

<p align="center">
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Vite-B73BA5?style=for-the-badge&logo=vite&logoColor=FFD62E" alt="Vite" />
</p>

TreeWise is a professional data structure visualization tool designed to help developers and students understand complex tree algorithms interactively. Built with React and TypeScript, it provides a smooth, animated canvas to observe how tree structures evolve in real time.

## Features

* **Dual Tree Support:** Seamlessly switch between a standard Binary Search Tree (BST) and an auto-balancing AVL Tree.
* **Core Operations:** Insert and delete nodes dynamically to see how the tree restructures itself.
* **Advanced Rotations:** Select a chain of three nodes in a BST to manually perform LL, RR, LR, and RL rotations. This is an excellent feature for learning the mechanics of AVL balancing algorithms.
* **Undo and Redo System:** Easily navigate backward and forward through your actions. Made a mistake? Just undo your last insertion or deletion to restore the exact previous state of the tree.
* **Random Tree Generation:** Instantly populate the canvas with a randomized tree for quick experimentation.
* **Smooth Animations:** Built with modern CSS transitions and React's efficient rendering to ensure nodes glide naturally to their new positions.

## Getting Started

### Prerequisites

Ensure you have Node.js installed on your local machine.

### Installation

1. Clone the repository to your local machine.
2. Navigate into the project directory:
   ```bash
   cd treewise
   ```
3. Install the required dependencies:
   ```bash
   npm install
   ```

### Running the Application

To start the development server, run:

```bash
npm run dev
```

Open the provided local URL in your browser to start interacting with TreeWise.

## Project Structure

* `src/components/` Contains the React components, including the main `TreeCanvas` for rendering the SVG based tree.
* `src/structures/` Contains the core logic classes: `TreeNode`, `BinarySearchTree`, and `AVLTree`.
* `src/layout/` Contains the mathematical layout logic to neatly position nodes horizontally and vertically without overlapping.

## Technologies Used

* React
* TypeScript
* Vite
* Vanilla CSS for styling and animations
