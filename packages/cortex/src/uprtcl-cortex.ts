// Required by inversify
import 'reflect-metadata';

/** Types */
export { Behaviour } from './types/behaviour';
export { Pattern } from './types/pattern';
export { Entity, recognizeEntity } from './types/entity';

/** Behaviours */
export { Clone } from './behaviours/clone';
export { Create } from './behaviours/create';
export { New } from './behaviours/new';
export { HasLinks, HasChildren } from './behaviours/has-links';
export { Signed } from './types/signable';
export { HasType } from './behaviours/has-type';
export { HasTitle } from './behaviours/has-title';
export { HasText } from './behaviours/has-text';
export { Transform } from './behaviours/transform';
export { HasActions, PatternAction } from './behaviours/has-actions';

// Pattern Registry
export { PatternRecognizer } from './recognizer/pattern-recognizer';

/** Modules */
export { CortexModule } from './cortex.module';
export { PatternsModule } from './patterns.module';

// Utils
export { entityFromGraphQlObject } from './graphql/resolvers';
