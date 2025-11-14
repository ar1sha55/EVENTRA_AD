import { login } from '@/routes';
import { store } from '@/routes/register';
import { Form, Head } from '@inertiajs/react';

import InputError from '@/components/input-error';
import { Spinner } from '@/components/ui/spinner';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import AuthLayout from '@/layouts/auth-layout';

const nationalityOptions = [
    'malaysia',
    'indonesia',
    'singapore',
    'japan',
    'china',
    'korea',
    'egypt',
    'yemen',
    'thailand',
    'vietnam',
    'saudi arabia',
    'nigeria',
    'iraq',
    'iran',
];

const facultyOptions: Record<string, string> = {
    fke: 'Faculty of Electrical Engineering',
    fkm: 'Faculty of Mechanical Engineering',
    fc: 'Faculty of Computing',
    fab: 'Faculty of Built Environment and Surveying',
    fka: 'Faculty of Civil Engineering',
    fs: 'Faculty of Science',
    fcee: 'Faculty of Chemical and Energy Engineering',
    fm: 'Faculty of Management',
    fssh: 'Faculty of Social Sciences and Humanities',
};

const genderOptions = ['male', 'female'];

const formatLabel = (str: string) => {
    return str
        .split(' ')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
};

export default function Register() {
    return (
        <AuthLayout
            title="Be a Club Member"
            description="Enter your details below to create your account"
        >
            <Head title="Register" />
            <Form
                {...store.form()}
                resetOnSuccess={['password', 'password_confirmation']}
                disableWhileProcessing
                className="flex flex-col gap-4"
            >
                {({ processing, errors }) => (
                    <>
                        <div className="grid gap-3">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Name</Label>
                                <Input
                                    id="name"
                                    type="text"
                                    required
                                    autoFocus
                                    tabIndex={1}
                                    autoComplete="name"
                                    name="name"
                                    placeholder="Full name"
                                />
                                <InputError
                                    message={errors.name}
                                    className="mt-1"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="email">Email address</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    required
                                    tabIndex={2}
                                    autoComplete="email"
                                    name="email"
                                    placeholder="email@graduate.utm.my"
                                    pattern=".+@graduate\.utm\.my"
                                    title="Please enter an email address ending with @graduate.utm.my"
                                />
                                <InputError
                                    message={errors.email}
                                    className="mt-1"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="matric_id">
                                        Matric ID
                                    </Label>
                                    <Input
                                        id="matric_id"
                                        type="text"
                                        required
                                        tabIndex={3}
                                        autoComplete="off"
                                        name="matric_id"
                                        placeholder="Matric ID"
                                    />
                                    <InputError
                                        message={errors.matric_id}
                                        className="mt-1"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="phone_number">
                                        Phone Number
                                    </Label>
                                    <Input
                                        id="phone_number"
                                        type="tel"
                                        required
                                        tabIndex={4}
                                        autoComplete="tel"
                                        name="phone_number"
                                        placeholder="e.g 0123456789"
                                        pattern="[0-9]{10,13}"
                                        title="Please enter a valid phone number with 10 to 13 digits."
                                    />
                                    <InputError
                                        message={errors.phone_number}
                                        className="mt-1"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="nationality">
                                        Nationality
                                    </Label>
                                    <Select name="nationality">
                                        <SelectTrigger
                                            id="nationality"
                                            className="w-full"
                                        >
                                            <SelectValue placeholder="Select a nationality" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {nationalityOptions.map(
                                                (nationality) => (
                                                    <SelectItem
                                                        key={nationality}
                                                        value={nationality}
                                                    >
                                                        {formatLabel(
                                                            nationality,
                                                        )}
                                                    </SelectItem>
                                                ),
                                            )}
                                        </SelectContent>
                                    </Select>
                                    <InputError
                                        message={errors.nationality}
                                        className="mt-1"
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="faculty">Faculty</Label>
                                    <Select name="faculty">
                                        <SelectTrigger
                                            id="faculty"
                                            className="w-full"
                                        >
                                            <SelectValue placeholder="Select a faculty" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <TooltipProvider>
                                                {Object.entries(
                                                    facultyOptions,
                                                ).map(([value, label]) => (
                                                    <Tooltip
                                                        key={value}
                                                        delayDuration={300}
                                                    >
                                                        <TooltipTrigger
                                                            asChild
                                                        >
                                                            <SelectItem
                                                                value={value}
                                                            >
                                                                {value.toUpperCase()}
                                                            </SelectItem>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            {label}
                                                        </TooltipContent>
                                                    </Tooltip>
                                                ))}
                                            </TooltipProvider>
                                        </SelectContent>
                                    </Select>
                                    <InputError
                                        message={errors.faculty}
                                        className="mt-1"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="password">Password</Label>
                                    <Input
                                        id="password"
                                        type="password"
                                        required
                                        tabIndex={5}
                                        autoComplete="new-password"
                                        name="password"
                                        placeholder="Password"
                                    />
                                    <InputError
                                        message={errors.password}
                                        className="mt-1"
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="password_confirmation">
                                        Confirm password
                                    </Label>
                                    <Input
                                        id="password_confirmation"
                                        type="password"
                                        required
                                        tabIndex={6}
                                        autoComplete="new-password"
                                        name="password_confirmation"
                                        placeholder="Confirm password"
                                    />
                                    <InputError
                                        message={
                                            errors.password_confirmation
                                        }
                                        className="mt-1"
                                    />
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="gender">Gender</Label>
                                <Select name="gender">
                                    <SelectTrigger
                                        id="gender"
                                        className="w-full"
                                    >
                                        <SelectValue placeholder="Select a gender" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {genderOptions.map((gender) => (
                                            <SelectItem
                                                key={gender}
                                                value={gender}
                                            >
                                                {formatLabel(gender)}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError
                                    message={errors.gender}
                                    className="mt-1"
                                />
                            </div>

                            <Button
                                type="submit"
                                className="w-full"
                                tabIndex={7}
                                data-test="register-user-button"
                            >
                                {processing && <Spinner />}
                                Create account
                            </Button>
                        </div>

                        <div className="text-center text-sm text-muted-foreground">
                            Already have an account?{' '}
                            <TextLink href={login()} tabIndex={8}>
                                Log in
                            </TextLink>
                        </div>
                    </>
                )}
            </Form>
        </AuthLayout>
    );
}

