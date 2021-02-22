export const UnimplementedError = () => new Error('UnimplementedError');
export const NodeAlreadyExistsError = (id: string) => new Error(`NodeAlreadyExistsError: Node ${id} already exists`);
export const NodeDoesNotExistError = (id: string) => new Error(`NodeDoesNotExistError: Node ${id} does not exist`);
export const DependencyDoesNotExistError = (id: string) => new Error(`DependencyDoesNotExistError: The dependency ${id} does not exist`);
export const NodeHasDescendantsError = (id: string) => new Error(`NodeHasDescendantsError: Cannot delete ${id} since it has descendants`);
