# Contributing to Fezi

Thank you for considering contributing to Fezi! This document outlines the process for contributing to this project.

## Development Process

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Setup Development Environment

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/fezi.git
cd fezi

# Install dependencies
pnpm install

# Run tests
pnpm test

# Build the package
pnpm build

# Run in development mode (with watch)
pnpm dev
```

## Commit Message Guidelines

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification for our commit messages:

- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation only changes
- `style`: Changes that do not affect the meaning of the code
- `refactor`: A code change that neither fixes a bug nor adds a feature
- `perf`: A code change that improves performance
- `test`: Adding missing tests or correcting existing tests
- `chore`: Changes to the build process or auxiliary tools and libraries

## Pull Request Process

1. Ensure any install or build dependencies are removed before the end of the layer when doing a build
2. Update the README.md with details of changes to the interface, if applicable
3. The versioning scheme we use is [SemVer](http://semver.org/)
4. You may merge the Pull Request once you have the sign-off of another developer

## Code Style

We use Prettier for code formatting. Please ensure your code is formatted before submitting:

```bash
pnpm format
```

## Running Tests

```bash
# Run tests once
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage
```

## License

By contributing, you agree that your contributions will be licensed under the project's MIT License.
