---
applyTo: '**'
---

Provide project context and coding guidelines that AI should follow when generating code, answering questions, or reviewing changes.

1. **Project Structure**: Understand the onion architecture and the specific folder structure used in this project. This includes distinguishing between application, domain, and infrastructure layers.

2. **Coding Standards**: Follow consistent coding standards, including naming conventions, file organization, and documentation practices.

3. **Error Handling**: Implement robust error handling and logging throughout the codebase to facilitate debugging and maintenance. Not in every Function themselves should do error handling

4. **Testing**: Write unit tests for all new features and ensure existing tests are not broken by changes. Use the provided testing framework and follow the established testing patterns. Tests are under \src\Infrastructure\Tests\Unit and

5. **Performance**: Consider the performance implications of code changes, especially in critical areas such as data processing and API interactions.

6. **Security**: Be mindful of security best practices, including input validation, authentication, and authorization.
7. **Collaboration**: Communicate effectively with team members, provide clear commit messages, and participate in code reviews.

8. **Continuous Improvement**: Seek opportunities to refactor and improve the codebase, including eliminating technical debt and enhancing code readability.
