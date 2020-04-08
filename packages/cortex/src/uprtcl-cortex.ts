// Required by inversify
import 'reflect-metadata';

/** Types */
export { Behaviour } from './types/behaviour';
export { Pattern } from './types/pattern';
export { Entity, recognizeEntity } from './types/entity';

/** Behaviours */
export { Cloneable } from './behaviours/cloneable';
export { Creatable } from './behaviours/creatable';
export { Newable } from './behaviours/newable';
export { Derivable } from './behaviours/derivable';
export { Hashable } from './behaviours/hashable';
export { HasLinks, HasChildren } from './behaviours/has-links';
export { IsSecure } from './behaviours/is-secure';
export { Signable, Signed } from './behaviours/signable';
export { IsValid } from './behaviours/is-valid';
export { HasType } from './behaviours/has-type';
export { HasTitle } from './behaviours/has-title';
export { HasText } from './behaviours/has-text';
export { Transformable } from './behaviours/transformable';
export { Updatable } from './behaviours/updatable';
export { HasActions, PatternAction } from './behaviours/has-actions';

// Pattern Registry
export { PatternRecognizer } from './recognizer/pattern-recognizer';

/** Modules */
export { CortexModule } from './cortex.module';
export { PatternsModule } from './patterns.module';

// Utils
export { entityFromGraphQlObject } from './graphql/resolvers';
