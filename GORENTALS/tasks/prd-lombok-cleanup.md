# PRD: Resolve Lombok @Data Redundancy

## Context
Multiple model files in the GoRentals backend use the `@Data` annotation alongside manual getter/setter methods, causing compiler warnings and code duplication.

## Objectives
- Resolve all "generated method already defined" warnings.
- Modernize the model layer by using explicit Lombok annotations.
- Reduce code bloat by removing redundant boilerplate.

## User Stories
### US-001: Refactor AdminUser.java
- **Description**: Replace `@Data` with `@Getter`, `@Setter`, `@NoArgsConstructor`, `@AllArgsConstructor`, and `@Builder`.
- **Action**: Delete lines 41-90 (manual methods).
- **Verification**: Code compiles without warnings.

### US-002: Refactor BlockedDate.java
- **Description**: Replace `@Data` with `@Getter`, `@Setter`, `@NoArgsConstructor`, `@AllArgsConstructor`, and `@Builder`.
- **Action**: Delete all manual getter/setter methods.
- **Verification**: Code compiles without warnings.

### US-003: Global Build Verification
- **Description**: Run `./mvnw clean compile` to ensure no regressions.
- **Verification**: BUILD SUCCESS with zero warnings related to Lombok.
